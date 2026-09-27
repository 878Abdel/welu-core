import { useCallback, useEffect, useRef, useState } from 'react';
import { errText, useToast } from '../lib/toast';
import {
  api,
  auditPayloadFor,
  type ApiProfile,
  type AuditResult,
  type CashQrResult,
  type PaperReceiptResult,
  type VoiceResult,
  type WhatsAppResult,
} from '../services/api';

export type Tab = 'home' | 'history' | 'cash' | 'kia' | 'profile';

/** Opération réellement renvoyée par le backend pendant la session. */
export type Op =
  | { kind: 'cash'; id: string; at: Date; phone: string; res: CashQrResult; wa: WhatsAppResult | null }
  | { kind: 'voice'; id: string; at: Date; text: string; res: VoiceResult }
  | { kind: 'paper'; id: string; at: Date; file: string; res: PaperReceiptResult };

export interface KiaMsg {
  id: number;
  text: string;
  res: VoiceResult | null;
  error?: string;
}

let seq = 0;

/** État de l'app commerçant : tout vient de l'API, rien n'est simulé côté front. */
export function useMerchant(profile: ApiProfile) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('home');
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [firstScore, setFirstScore] = useState<number | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [ops, setOps] = useState<Op[]>([]);
  const [receipt, setReceipt] = useState<Extract<Op, { kind: 'cash' }> | null>(null);
  const [cashing, setCashing] = useState(false);
  const [kia, setKia] = useState<KiaMsg[]>([]);
  const [kiaBusy, setKiaBusy] = useState(false);
  const [paperBusy, setPaperBusy] = useState(false);

  // Événements et cash certifiés pendant la session : ré-injectés dans l'audit.
  const extra = useRef({ events: [] as string[], cash: 0 });

  const runAudit = useCallback(async () => {
    setAuditing(true);
    setAuditError(null);
    try {
      const r = await api.audit(auditPayloadFor(profile, extra.current.events, extra.current.cash));
      setAudit(r);
      setFirstScore((s) => s ?? r.welu_score);
      return r;
    } catch (e) {
      setAuditError(errText(e));
      toast(errText(e), 'error');
      return null;
    } finally {
      setAuditing(false);
    }
  }, [profile, toast]);

  useEffect(() => {
    runAudit();
  }, [runAudit]);

  /** Encaisser cash : /api/validate-cash-qr → /api/whatsapp/send → reçu → nouvel audit. */
  const cashIn = async (amount: number, phone: string) => {
    setCashing(true);
    try {
      const res = await api.validateCashQr({ merchant_name: `${profile.name} (${profile.activity})`, client_phone: phone, amount });
      let wa: WhatsAppResult | null = null;
      try {
        wa = await api.whatsappSend({ phone: phone.replace(/\s/g, ''), amount: res.amount_fcfa, receipt_id: res.receipt_id, merchant: profile.name });
      } catch (e) {
        toast(`Vente validée, mais WhatsApp a échoué : ${errText(e)}`, 'error');
      }
      const op = { kind: 'cash' as const, id: res.receipt_id, at: new Date(), phone, res, wa };
      setOps((l) => [op, ...l]);
      setReceipt(op);
      extra.current.events.push('cash_qr_client_verified');
      extra.current.cash += res.amount_fcfa;
      runAudit();
      return true;
    } catch (e) {
      toast(errText(e), 'error');
      return false;
    } finally {
      setCashing(false);
    }
  };

  /** Kia : note vocale / texte en wolof → /api/parse-voice (NVIDIA NIM). */
  const askKia = async (text: string) => {
    const id = ++seq;
    setKia((l) => [...l, { id, text, res: null }]);
    setKiaBusy(true);
    try {
      const res = await api.parseVoice(text);
      setKia((l) => l.map((m) => (m.id === id ? { ...m, res } : m)));
      setOps((l) => [{ kind: 'voice', id: `VOX-${id}`, at: new Date(), text, res }, ...l]);
    } catch (e) {
      setKia((l) => l.map((m) => (m.id === id ? { ...m, error: errText(e) } : m)));
      toast(errText(e), 'error');
    } finally {
      setKiaBusy(false);
    }
  };

  /** Facture papier grossiste → /api/audit-paper-receipt (Llama 3.2 Vision) → nouvel audit. */
  const auditPaper = async (imageUrl: string, file: string) => {
    setPaperBusy(true);
    try {
      const res = await api.auditPaperReceipt(imageUrl);
      setOps((l) => [{ kind: 'paper', id: `FAC-${++seq}`, at: new Date(), file, res }, ...l]);
      toast(res.impact_scoring, 'ok');
      extra.current.events.push('grossiste_stock_wave');
      runAudit();
    } catch (e) {
      toast(errText(e), 'error');
    } finally {
      setPaperBusy(false);
    }
  };

  return {
    profile,
    tab,
    open: setTab,
    audit,
    firstScore,
    auditing,
    auditError,
    runAudit,
    ops,
    receipt,
    closeReceipt: () => setReceipt(null),
    showReceipt: setReceipt,
    cashing,
    cashIn,
    kia,
    kiaBusy,
    askKia,
    paperBusy,
    auditPaper,
  };
}

export type MerchantApi = ReturnType<typeof useMerchant>;
