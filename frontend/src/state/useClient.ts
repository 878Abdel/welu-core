import { useCallback, useEffect, useReducer, useRef } from 'react';
import { LOAN_TYPES } from '../data/accounts';
import type { Contribution, LoanType, MerchantProfile, SourceKind, Transaction } from '../data/types';
import type { KiaTopic, Lang } from '../services/kia';
import { clock, fcfa } from '../lib/format';
import { useMotionPrefs } from '../motion/MotionPrefs';
import { source } from '../services/scoringSource';
import { offerFor, scoreOfContributions } from '../services/solvency';

export type ClientTab = 'home' | 'history' | 'qr' | 'loan' | 'profile' | 'kia';
export type QrMode = 'show' | 'scan';

export interface ClientState {
  profile: MerchantProfile | null;
  contributions: Contribution[];
  /** Score à l'ouverture de l'app : sert à afficher la progression de la session, sans l'inventer. */
  openingScore: number;
  transactions: Transaction[];
  tab: ClientTab;
  qrMode: QrMode;
  /** Étape du parcours QR en cours. */
  qrStep: 'idle' | 'confirming' | 'confirmed' | 'detected' | 'paid';
  saleIndex: number;
  /** Type de prêt demandé (envoyé à la banque). */
  loanRequested: LoanType | null;
  /** Conversation avec Kia : sujets demandés, dans l'ordre. */
  kia: { id: number; topic: KiaTopic }[];
  lang: Lang;
  /** Relevé Orange Money importé (PDF), en attente d'analyse côté serveur. */
  statement: string | null;
  shareWithBank: boolean;
  busy: boolean;
  toast: { id: number; text: string } | null;
  source: SourceKind;
  error: string | null;
}

type Action =
  | { type: 'load'; profile: MerchantProfile }
  | { type: 'tab'; tab: ClientTab }
  | { type: 'qrMode'; mode: QrMode }
  | { type: 'qrStep'; step: ClientState['qrStep'] }
  | { type: 'sale'; transaction: Transaction; contributions: Contribution[]; source: SourceKind }
  | { type: 'payment'; transaction: Transaction }
  | { type: 'busy'; busy: boolean }
  | { type: 'toast'; text: string | null }
  | { type: 'loan'; loan: LoanType }
  | { type: 'kia'; topic: KiaTopic }
  | { type: 'lang'; lang: Lang }
  | { type: 'statement'; name: string }
  | { type: 'share' }
  | { type: 'error'; message: string };

const initial: ClientState = {
  profile: null,
  contributions: [],
  openingScore: 0,
  transactions: [],
  tab: 'home',
  qrMode: 'show',
  qrStep: 'idle',
  saleIndex: 0,
  loanRequested: null,
  kia: [{ id: 0, topic: 'intro' }],
  lang: 'fr',
  shareWithBank: true,
  statement: null,
  busy: false,
  toast: null,
  source: source.kind,
  error: null,
};

let seq = 0;

function reducer(s: ClientState, a: Action): ClientState {
  switch (a.type) {
    case 'load':
      return {
        ...initial,
        profile: a.profile,
        contributions: a.profile.contributions,
        openingScore: scoreOfContributions(a.profile.contributions),
        transactions: a.profile.transactions,
      };
    case 'tab':
      return { ...s, tab: a.tab, qrStep: a.tab === 'qr' ? s.qrStep : 'idle' };
    case 'qrMode':
      return { ...s, qrMode: a.mode, qrStep: 'idle' };
    case 'qrStep':
      return { ...s, qrStep: a.step };
    case 'sale':
      return {
        ...s,
        contributions: a.contributions,
        transactions: [a.transaction, ...s.transactions],
        saleIndex: s.saleIndex + 1,
        source: a.source,
        busy: false,
      };
    case 'payment':
      return { ...s, transactions: [a.transaction, ...s.transactions], busy: false };
    case 'busy':
      return { ...s, busy: a.busy };
    case 'toast':
      return { ...s, toast: a.text ? { id: ++seq, text: a.text } : null };
    case 'loan':
      return { ...s, loanRequested: a.loan };
    case 'kia':
      return { ...s, kia: [...s.kia, { id: ++seq, topic: a.topic }] };
    case 'lang':
      return { ...s, lang: a.lang };
    case 'statement':
      return { ...s, statement: a.name };
    case 'share':
      return { ...s, shareWithBank: !s.shareWithBank };
    case 'error':
      return { ...s, error: a.message, busy: false };
  }
}

/** Délais du parcours « vente certifiée » : confirmation, retour à l'accueil, puis la brique tombe. */
const SALE_FLOW = { confirmed: 700, backHome: 1100, apply: 1350, toastOff: 3200 };

export function useClient(profileId: string) {
  const { reduced } = useMotionPrefs();
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const timers = useRef<number[]>([]);
  const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, reducedRef.current ? 0 : ms));

  useEffect(() => {
    let alive = true;
    source
      .getProfile(profileId)
      .then((profile) => alive && dispatch({ type: 'load', profile }))
      .catch((e: Error) => dispatch({ type: 'error', message: e.message }));
    return () => {
      alive = false;
      timers.current.forEach(clearTimeout);
    };
  }, [profileId]);

  const toast = (text: string) => {
    dispatch({ type: 'toast', text });
    at(SALE_FLOW.toastOff, () => dispatch({ type: 'toast', text: null }));
  };

  const open = useCallback((tab: ClientTab) => dispatch({ type: 'tab', tab }), []);
  const setQrMode = useCallback((mode: QrMode) => dispatch({ type: 'qrMode', mode }), []);

  /** Démo : un client scanne le QR du commerçant et confirme son achat. */
  const simulateCustomerScan = useCallback(async () => {
    const s = stateRef.current;
    if (!s.profile || s.busy) return;
    const preset = s.profile.salePresets[s.saleIndex % s.profile.salePresets.length];
    dispatch({ type: 'busy', busy: true });
    dispatch({ type: 'qrStep', step: 'confirming' });
    try {
      const before = scoreOfContributions(s.contributions);
      const { transaction, result } = await source.recordSale(s.profile.id, preset);
      at(SALE_FLOW.confirmed, () => dispatch({ type: 'qrStep', step: 'confirmed' }));
      at(SALE_FLOW.backHome, () => dispatch({ type: 'tab', tab: 'home' }));
      // Le score n'est mis à jour qu'une fois l'accueil visible : on voit la brique tomber.
      at(SALE_FLOW.apply, () => {
        dispatch({ type: 'sale', transaction, contributions: result.contributions, source: result.source });
        const gain = result.score - before;
        toast(gain > 0 ? `Vente certifiée · ${fcfa(transaction.amount)} · +${gain} points` : `Vente certifiée · ${fcfa(transaction.amount)}`);
      });
    } catch (e) {
      dispatch({ type: 'error', message: (e as Error).message });
    }
  }, []);

  /** Démo : le scanner détecte le QR d'un fournisseur. */
  const simulateDetection = useCallback(() => dispatch({ type: 'qrStep', step: 'detected' }), []);

  const validatePayment = useCallback(async () => {
    const s = stateRef.current;
    if (!s.profile || s.busy) return;
    dispatch({ type: 'busy', busy: true });
    try {
      const transaction = await source.recordPayment(s.profile.id, s.profile.scanPreset);
      dispatch({ type: 'payment', transaction });
      dispatch({ type: 'qrStep', step: 'paid' });
      toast(`Paiement enregistré · ${fcfa(-transaction.amount)}`);
    } catch (e) {
      dispatch({ type: 'error', message: (e as Error).message });
    }
  }, []);

  const requestLoan = useCallback(async (type: LoanType) => {
    const s = stateRef.current;
    if (!s.profile) return;
    const t = LOAN_TYPES.find((l) => l.id === type)!;
    const o = offerFor(s.profile.finances, t.months);
    await source.requestLoan(s.profile.id, { type, amount: o.amount, months: t.months, time: clock() });
    dispatch({ type: 'loan', loan: type });
    toast(`Demande envoyée · ${t.label.toLowerCase()} · ${fcfa(o.amount)}`);
  }, []);

  const askKia = useCallback((topic: KiaTopic) => dispatch({ type: 'kia', topic }), []);
  const setLang = useCallback((lang: Lang) => dispatch({ type: 'lang', lang }), []);
  const importStatement = useCallback((file: File) => {
    dispatch({ type: 'statement', name: file.name });
    toast('Relevé reçu · analyse disponible avec le backend');
  }, []);

  const toggleShare = useCallback(() => dispatch({ type: 'share' }), []);

  return { state, open, setQrMode, simulateCustomerScan, simulateDetection, validatePayment, requestLoan, toggleShare, askKia, setLang, importStatement };
}

export type ClientApi = ReturnType<typeof useClient>;
