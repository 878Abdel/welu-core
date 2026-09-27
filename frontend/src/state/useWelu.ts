import { useCallback, useEffect, useReducer, useRef, type RefObject } from 'react';
import type {
  Contribution,
  ContributionKey,
  FraudAnalysis,
  MerchantProfile,
  ScoreResult,
  SourceKind,
  Transaction,
} from '../data/types';
import { clock, fcfa } from '../lib/format';
import { useMotionPrefs } from '../motion/MotionPrefs';
import { edgeTraceMs, FRAUD, MATERIALIZE, PULSE } from '../motion/timeline';
import { source } from '../services/scoringSource';

export type Phase = 'ghost' | 'bankable';
export type Panel = 'sources' | 'xai' | 'fraud';
export type FraudStage = 'none' | 'graph' | 'tracing' | 'locked' | 'clear';

export interface Point {
  x: number;
  y: number;
}

export interface Pulse {
  id: number;
  from: Point;
  via: Point;
  to: Point;
  /** Orientation de la séparation franchie (verticale en split, horizontale sur mobile). */
  vertical: boolean;
}

export interface LogEntry {
  id: number;
  time: string;
  text: string;
  tone: 'neutral' | 'positive' | 'alert';
}

export interface WeluState {
  profile: MerchantProfile | null;
  runId: number;
  phase: Phase;
  /** Nombre de sources de données arrivées (0 → 4). */
  revealed: number;
  contributions: Contribution[];
  transactions: Transaction[];
  panel: Panel;
  fraud: FraudAnalysis | null;
  fraudStage: FraudStage;
  frozen: boolean;
  pulse: Pulse | null;
  impact: { id: number; key: ContributionKey } | null;
  saleIndex: number;
  busy: boolean;
  log: LogEntry[];
  source: SourceKind;
  error: string | null;
}

type Action =
  | { type: 'load'; profile: MerchantProfile }
  | { type: 'reveal'; count: number }
  | { type: 'phase'; phase: Phase }
  | { type: 'panel'; panel: Panel }
  | { type: 'saleStart' }
  | { type: 'saleRecorded'; transaction: Transaction }
  | { type: 'pulse'; pulse: Pulse | null }
  | { type: 'impact'; result: ScoreResult }
  | { type: 'fraud'; analysis: FraudAnalysis }
  | { type: 'fraudStage'; stage: FraudStage }
  | { type: 'log'; entry: Omit<LogEntry, 'id' | 'time'> }
  | { type: 'error'; message: string };

const initial: WeluState = {
  profile: null,
  runId: 0,
  phase: 'ghost',
  revealed: 0,
  contributions: [],
  transactions: [],
  panel: 'sources',
  fraud: null,
  fraudStage: 'none',
  frozen: false,
  pulse: null,
  impact: null,
  saleIndex: 0,
  busy: false,
  log: [],
  source: source.kind,
  error: null,
};

let seq = 0;
const nextId = () => ++seq;

function reducer(s: WeluState, a: Action): WeluState {
  switch (a.type) {
    case 'load':
      return {
        ...initial,
        profile: a.profile,
        runId: s.runId + 1,
        contributions: a.profile.contributions,
        transactions: a.profile.transactions,
        log: [],
      };
    case 'reveal':
      return { ...s, revealed: a.count };
    case 'phase':
      return { ...s, phase: a.phase };
    case 'panel':
      return { ...s, panel: a.panel };
    case 'saleStart':
      return { ...s, busy: true };
    case 'saleRecorded':
      return {
        ...s,
        transactions: [a.transaction, ...s.transactions],
        saleIndex: s.saleIndex + 1,
      };
    case 'pulse':
      return { ...s, pulse: a.pulse };
    case 'impact':
      return {
        ...s,
        contributions: a.result.contributions,
        frozen: s.frozen || a.result.frozen,
        source: a.result.source,
        impact: { id: nextId(), key: 'cash_certified' },
        busy: false,
      };
    case 'fraud':
      return { ...s, fraud: a.analysis, panel: 'fraud', fraudStage: 'graph', source: a.analysis.source };
    case 'fraudStage':
      return { ...s, fraudStage: a.stage, frozen: s.frozen || a.stage === 'locked' };
    case 'log':
      return { ...s, log: [{ ...a.entry, id: nextId(), time: clock(true) }, ...s.log].slice(0, 12) };
    case 'error':
      return { ...s, error: a.message, busy: false };
  }
}

export const scoreOf = (cs: Contribution[], revealed = cs.length) =>
  cs.slice(0, revealed).reduce((sum, c) => sum + c.points, 0);

interface Anchors {
  origin: RefObject<HTMLElement | null>;
  target: RefObject<HTMLElement | null>;
  divider: RefObject<HTMLElement | null>;
}

const centerOf = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
};

export function useWelu(anchors: Anchors) {
  const { reduced } = useMotionPrefs();
  const [state, dispatch] = useReducer(reducer, initial);

  const stateRef = useRef(state);
  stateRef.current = state;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const timers = useRef<number[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  /** Planifie une étape de séquence ; en mouvement réduit, tout arrive immédiatement. */
  const at = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, reducedRef.current ? 0 : ms));
  };
  const log = (text: string, tone: LogEntry['tone'] = 'neutral') =>
    dispatch({ type: 'log', entry: { text, tone } });

  // ① Matérialisation
  const loadToken = useRef(0);
  const load = useCallback(async (id: string) => {
    const token = ++loadToken.current;
    try {
      const profile = await source.getProfile(id);
      // Un chargement plus récent a eu lieu entre-temps (double clic, StrictMode) : on l'abandonne.
      if (token !== loadToken.current) return;
      clearTimers();
      dispatch({ type: 'load', profile });
      log(`Dossier ${profile.dossier} ouvert · aucun historique bancaire`);
      profile.contributions.forEach((c, i) =>
        at(MATERIALIZE.steps[i] ?? MATERIALIZE.settle, () => {
          dispatch({ type: 'reveal', count: i + 1 });
          log(`Source intégrée · ${c.label} (+${c.points})`);
        }),
      );
      at(MATERIALIZE.settle, () => {
        dispatch({ type: 'phase', phase: 'bankable' });
        const score = scoreOf(profile.contributions);
        log(score >= 60 ? `Score ${score} · profil bancarisable` : `Score ${score} · profil à consolider`, 'positive');
      });
    } catch (e) {
      dispatch({ type: 'error', message: (e as Error).message });
    }
  }, []);

  // ② Propagation
  const measurePulse = (): Pulse | null => {
    const { origin, target, divider } = anchors;
    if (!origin.current || !target.current || !divider.current) return null;
    const o = origin.current.getBoundingClientRect();
    const from = { x: o.right - 28, y: o.top + o.height / 2 };
    const to = centerOf(target.current);
    const d = centerOf(divider.current);
    const vertical = d.r.height > d.r.width;
    return {
      id: nextId(),
      from,
      via: vertical ? { x: d.x, y: from.y } : { x: from.x, y: d.y },
      to: { x: to.x, y: to.y },
      vertical,
    };
  };

  const recordSale = useCallback(async () => {
    const s = stateRef.current;
    if (!s.profile || s.busy || s.phase !== 'bankable') return;
    const preset = s.profile.salePresets[s.saleIndex % s.profile.salePresets.length];
    dispatch({ type: 'saleStart' });
    try {
      const before = scoreOf(s.contributions);
      const { transaction, result } = await source.recordSale(s.profile.id, preset);
      const pulse = reducedRef.current ? null : measurePulse();
      dispatch({ type: 'saleRecorded', transaction });
      if (pulse) dispatch({ type: 'pulse', pulse });
      at(pulse ? PULSE.impact : 0, () => {
        dispatch({ type: 'impact', result });
        if (result.frozen) log(`↳ Vente reçue · ${fcfa(transaction.amount)} · score gelé, non recalculé`, 'alert');
        else log(`↳ Vente reçue · ${fcfa(transaction.amount)} cash confirmé · score ${before} → ${result.score}`, 'positive');
      });
    } catch (e) {
      dispatch({ type: 'error', message: (e as Error).message });
    }
  }, []);

  const pulseDone = useCallback(() => dispatch({ type: 'pulse', pulse: null }), []);

  // ③ Décomposition
  const setPanel = useCallback((panel: Panel) => {
    const s = stateRef.current;
    if (s.phase !== 'bankable') return;
    if (panel === 'fraud' && s.fraudStage === 'none') return void analyzeFraud();
    dispatch({ type: 'panel', panel });
  }, []);

  const toggleXai = useCallback(() => {
    const s = stateRef.current;
    setPanel(s.panel === 'xai' ? (s.fraudStage === 'none' ? 'sources' : 'fraud') : 'xai');
  }, []);

  // Fraude
  const analyzeFraud = useCallback(async () => {
    const s = stateRef.current;
    if (!s.profile || s.phase !== 'bankable') return;
    if (s.fraudStage !== 'none') return dispatch({ type: 'panel', panel: 'fraud' });
    try {
      const analysis = await source.analyzeFraud(s.profile.id);
      dispatch({ type: 'fraud', analysis });
      log(`Analyse des flux · ${s.profile.flows.windowDays} derniers jours`);
      if (!analysis.cycles.length) {
        at(FRAUD.traceStart, () => {
          dispatch({ type: 'fraudStage', stage: 'clear' });
          log('Aucun flux circulaire détecté', 'positive');
        });
        return;
      }
      const edges = analysis.cycles[0].length;
      at(FRAUD.traceStart, () => dispatch({ type: 'fraudStage', stage: 'tracing' }));
      at(FRAUD.traceStart + edges * edgeTraceMs, () => {
        dispatch({ type: 'fraudStage', stage: 'locked' });
        const pts = analysis.inflated.reduce((sum, i) => sum + i.points, 0);
        log(`Cycle de ${edges} comptes détecté · ${pts} pts gonflés · score gelé`, 'alert');
      });
    } catch (e) {
      dispatch({ type: 'error', message: (e as Error).message });
    }
  }, []);

  useEffect(() => clearTimers, []);

  return { state, load, recordSale, pulseDone, setPanel, toggleXai, analyzeFraud };
}
