import { findAccount } from '../data/accounts';
import { mockInflation, profiles } from '../data/profiles';
import { prospects } from '../data/prospects';
import type {
  Contribution,
  FraudAnalysis,
  LoanRequest,
  MerchantProfile,
  ProfileSummary,
  Prospect,
  SalePreset,
  SaleResult,
  SourceKind,
  Transaction,
} from '../data/types';
import { clock } from '../lib/format';
import { cycleEdges, findCyclesThrough } from './cycles';

/** Tout ce dont l'interface a besoin. Deux implémentations : simulation locale ou API FastAPI. */
export interface ScoringSource {
  kind: SourceKind;
  listProfiles(): Promise<ProfileSummary[]>;
  getProfile(id: string): Promise<MerchantProfile>;
  recordSale(profileId: string, sale: SalePreset): Promise<SaleResult>;
  analyzeFraud(profileId: string): Promise<FraudAnalysis>;
  /** Paiement sortant scanné par le commerçant (fournisseur). */
  recordPayment(profileId: string, payment: SalePreset): Promise<Transaction>;
  /** Clients probables vus par la banque. */
  listProspects(): Promise<Prospect[]>;
  /** Demande de prêt envoyée depuis l'app client ; elle apparaît dans la console banque. */
  requestLoan(profileId: string, request: LoanRequest): Promise<void>;
}

// ── Simulation locale ───────────────────────────────────────

/** Règle simulée, affichée telle quelle dans l'interface : +2 pts par vente cash confirmée. */
export const MOCK_POINTS_PER_CERTIFIED_SALE = 2;

interface MockSession {
  contributions: Contribution[];
  frozen: boolean;
  seq: number;
}

const sessions = new Map<string, MockSession>();
const loanRequests = new Map<string, LoanRequest>();

const findProfile = (id: string) => {
  const p = findAccount(id);
  if (!p) throw new Error(`Profil inconnu : ${id}`);
  return p;
};

const total = (cs: Contribution[]) => cs.reduce((s, c) => s + c.points, 0);

/** Session simulée par profil, créée à la demande (l'app client et la console peuvent l'ouvrir dans n'importe quel ordre). */
const session = (id: string): MockSession => {
  let s = sessions.get(id);
  if (!s) {
    s = { contributions: structuredClone(findProfile(id).contributions), frozen: false, seq: 0 };
    sessions.set(id, s);
  }
  return s;
};

export const mockSource: ScoringSource = {
  kind: 'mock',

  async listProfiles() {
    return profiles.map(({ id, name, trade }) => ({ id, name, trade }));
  },

  async getProfile(id) {
    const p = findProfile(id);
    sessions.set(id, { contributions: structuredClone(p.contributions), frozen: false, seq: 0 });
    return structuredClone(p);
  },

  async recordSale(profileId, sale) {
    const s = session(profileId);
    s.seq += 1;
    if (!s.frozen) {
      const gain = Math.min(MOCK_POINTS_PER_CERTIFIED_SALE, 100 - total(s.contributions));
      s.contributions = s.contributions.map((c) =>
        c.key === 'cash_certified' ? { ...c, points: c.points + gain } : c,
      );
    }
    return {
      transaction: {
        id: `${profileId}-live-${s.seq}`,
        label: sale.label,
        amount: sale.amount,
        channel: 'cash',
        certified: true,
        time: clock(),
      },
      result: {
        score: total(s.contributions),
        contributions: structuredClone(s.contributions),
        frozen: s.frozen,
        source: 'mock',
      },
    };
  },

  async analyzeFraud(profileId) {
    const p = findProfile(profileId);
    const cycles = findCyclesThrough(p.flows, p.id);
    if (cycles.length) session(profileId).frozen = true;
    // Montant qui a fait le tour complet : le plus petit volume sur les arêtes du cycle.
    const recirculated = cycles.reduce(
      (sum, c) => sum + Math.min(...cycleEdges(p.flows, c).map((e) => e.amount * e.count)),
      0,
    );
    return {
      cycles,
      inflated: cycles.length ? (mockInflation[profileId] ?? []) : [],
      recirculated,
      source: 'mock',
    };
  },

  async recordPayment(profileId, payment) {
    const s = session(profileId);
    s.seq += 1;
    return {
      id: `${profileId}-pay-${s.seq}`,
      label: payment.label,
      amount: -payment.amount,
      channel: 'mobile_money',
      certified: true,
      time: clock(),
    };
  },

  async listProspects() {
    return prospects.map((p) => ({ ...structuredClone(p), request: loanRequests.get(p.id) }));
  },

  async requestLoan(profileId, request) {
    loanRequests.set(profileId, request);
  },
};

// ── API FastAPI (étape backend) ──────────────────────────────

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status} sur ${path}`);
  return res.json() as Promise<T>;
}

export const apiSource: ScoringSource = {
  kind: 'api',
  listProfiles: () => http('/profiles'),
  getProfile: (id) => http(`/profiles/${id}`),
  recordSale: (id, sale) => http(`/profiles/${id}/transactions`, { method: 'POST', body: JSON.stringify(sale) }),
  analyzeFraud: (id) => http(`/profiles/${id}/fraud-analysis`, { method: 'POST' }),
  recordPayment: (id, p) => http(`/profiles/${id}/payments`, { method: 'POST', body: JSON.stringify(p) }),
  listProspects: () => http('/prospects'),
  requestLoan: (id, r) => http(`/profiles/${id}/loan-requests`, { method: 'POST', body: JSON.stringify(r) }),
};

export const source: ScoringSource = API_URL ? apiSource : mockSource;
