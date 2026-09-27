// ─────────────────────────────────────────────────────────────
// PROFILS DE DÉMONSTRATION complémentaires à /api/profiles.
// Seuls les SIGNAUX d'entrée sont définis ici ; le score, la décision,
// la notation et la décomposition SHAP viennent toujours de /api/audit.
// ─────────────────────────────────────────────────────────────
import type { ApiProfile, AuditPayload } from '../services/api';

export type Segment = 'pro' | 'particulier';

export interface Signals {
  volume: number; // Wave / OM mensuel (FCFA)
  txns: number;
  woyofal: number; // mois de recharges à l'heure
  delays: number;
  sim: number; // ancienneté SIM (ans)
  geo: number; // ancrage marché 0-1
  clients: number;
  cash: number; // cash certifié QR (FCFA)
  events: string[];
}

const GOOD = ['woyofal_ontime', 'cash_qr_client_verified'];

function make(id: string, name: string, activity: string, segment: Segment, s: Signals): ApiProfile {
  const extra: Omit<AuditPayload, keyof ApiProfile['metrics']> = {
    sender_id: `client_${id}`,
    receiver_id: id,
    wave_om_txns_count: s.txns,
    woyofal_delays: s.delays,
    unique_clients_count: s.clients,
    new_transaction: { amount: Math.max(1000, Math.round(s.volume / Math.max(1, s.txns))), hour: 12, minutes_since_last_txn: 90, distance_from_last_txn_km: 0.6 },
    recent_events: s.events,
  };
  return {
    id,
    name,
    activity,
    segment,
    source: 'catalog',
    tier: '',
    score: 0,
    decision: '',
    metrics: {
      wave_om_volume_monthly: s.volume,
      woyofal_streak_months: s.woyofal,
      sim_age_years: s.sim,
      market_geo_anchor_rate: s.geo,
      cash_qr_volume: s.cash,
    },
    auditExtra: extra,
  };
}

export const CATALOG: ApiProfile[] = [
  make('mamadou', 'Mamadou Fall', 'Quincaillerie (Thiaroye)', 'pro', { volume: 2_600_000, txns: 60, woyofal: 12, delays: 0, sim: 6, geo: 0.88, clients: 40, cash: 120_000, events: [...GOOD, 'grossiste_stock_wave'] }),
  make('aminata', 'Aminata Sarr', 'Restauration (Médina)', 'pro', { volume: 1_200_000, txns: 45, woyofal: 14, delays: 0, sim: 5, geo: 0.9, clients: 35, cash: 90_000, events: GOOD }),
  make('ibrahima', 'Ibrahima Sow', 'Téléphonie (Petersen)', 'pro', { volume: 3_100_000, txns: 70, woyofal: 10, delays: 1, sim: 3, geo: 0.7, clients: 30, cash: 60_000, events: ['cash_qr_client_verified', 'grossiste_stock_wave'] }),
  make('khady', 'Khady Faye', 'Cosmétiques (HLM)', 'pro', { volume: 900_000, txns: 30, woyofal: 11, delays: 1, sim: 9, geo: 0.95, clients: 22, cash: 40_000, events: GOOD }),
  make('ousmane', 'Ousmane Ba', 'Menuiserie (Pikine)', 'pro', { volume: 1_500_000, txns: 18, woyofal: 6, delays: 2, sim: 7, geo: 0.8, clients: 12, cash: 70_000, events: ['cash_qr_client_verified'] }),
  make('seynabou', 'Seynabou Diallo', 'Poissonnerie (Soumbédioune)', 'pro', { volume: 1_100_000, txns: 50, woyofal: 12, delays: 1, sim: 3, geo: 0.75, clients: 28, cash: 55_000, events: GOOD }),
  make('modou-gueye', 'Modou Gueye', 'Chauffeur moto-taxi (Parcelles Assainies)', 'pro', { volume: 450_000, txns: 80, woyofal: 4, delays: 2, sim: 3, geo: 0.5, clients: 60, cash: 30_000, events: ['cash_qr_client_verified', 'daily_food_purchase'] }),
  make('mariama', 'Mariama Diouf', 'Maraîchère (Niayes)', 'pro', { volume: 800_000, txns: 25, woyofal: 3, delays: 0, sim: 8, geo: 0.9, clients: 18, cash: 50_000, events: ['cash_qr_client_verified'] }),
  make('fatou', 'Fatou Sarr', 'Particulière (Guédiawaye)', 'particulier', { volume: 90_000, txns: 8, woyofal: 10, delays: 1, sim: 5, geo: 0.3, clients: 3, cash: 0, events: ['woyofal_ontime', 'daily_food_purchase'] }),
  make('ndeye', 'Ndèye Fall', 'Particulière (Pikine)', 'particulier', { volume: 150_000, txns: 12, woyofal: 14, delays: 0, sim: 7, geo: 0.35, clients: 4, cash: 0, events: ['woyofal_ontime'] }),
  make('cheikh', 'Cheikh Diop', 'Salarié (Yoff)', 'particulier', { volume: 320_000, txns: 15, woyofal: 36, delays: 0, sim: 9, geo: 0.4, clients: 5, cash: 0, events: ['woyofal_ontime', 'daily_food_purchase'] }),
];

/** Nouveau compte créé dans l'app : aucun historique, signaux de départ minimaux. */
export function newAccount(name: string, activity: string, segment: Segment): ApiProfile {
  const id = `new-${Date.now().toString(36)}`;
  return {
    ...make(id, name, activity, segment, { volume: 0, txns: 0, woyofal: 0, delays: 0, sim: 0.1, geo: segment === 'pro' ? 0.2 : 0, clients: 0, cash: 0, events: [] }),
    source: 'new',
  };
}

export const ACTIVITIES = [
  { id: 'commerce', label: 'Commerçant(e)', hint: 'Boutique, marché' },
  { id: 'transport', label: 'Chauffeur', hint: 'Taxi, moto, car rapide' },
  { id: 'artisanat', label: 'Artisan', hint: 'Couture, menuiserie' },
  { id: 'restauration', label: 'Restauration', hint: 'Gargote, dibiterie' },
  { id: 'agriculture', label: 'Agriculture', hint: 'Maraîchage, élevage' },
  { id: 'peche', label: 'Pêche', hint: 'Mareyage, poissonnerie' },
] as const;
