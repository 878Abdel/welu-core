/**
 * Client HTTP du backend Wëlu (FastAPI sur NVIDIA L40S).
 * Une fonction par route ; aucun mock : si l'API échoue, l'erreur remonte à l'UI.
 */

export const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'https://8000-rct7of4rd.gobrev.dev';

export class ApiError extends Error {
  constructor(
    message: string,
    public route: string,
  ) {
    super(message);
  }
}

async function call<T>(route: string, body?: unknown, timeoutMs = 20_000): Promise<T> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}${route}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json; charset=utf-8' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const detail = await res.json().then((j) => j?.detail, () => null);
      throw new ApiError(`${route} : HTTP ${res.status}${detail ? ` (${typeof detail === 'string' ? detail : JSON.stringify(detail)})` : ''}`, route);
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    const aborted = (e as Error).name === 'AbortError';
    throw new ApiError(aborted ? `${route} : pas de réponse après ${timeoutMs / 1000} s` : `${route} : backend injoignable`, route);
  } finally {
    clearTimeout(t);
  }
}

/* ---------- Types des réponses ---------- */

export interface Health {
  status: string;
  engine: string;
  compute_hardware: string;
  active_device: string;
  nim_multimodal_llm: string;
}

export interface GpuTelemetry {
  gpu_hardware: string;
  total_vram_gb: number;
  allocated_vram_mb: number;
  cuda_driver_version: string;
  streaming_multiprocessors: number;
  gpu_status: string;
  inference_latency_target?: string;
  cluster_node?: string;
}

export interface ApiProfile {
  id: string;
  name: string;
  activity: string;
  tier: string;
  score: number;
  decision: string;
  metrics: {
    wave_om_volume_monthly: number;
    woyofal_streak_months: number;
    sim_age_years: number;
    market_geo_anchor_rate: number;
    cash_qr_volume: number;
  };
  /* Champs ajoutés côté front */
  segment?: 'pro' | 'particulier';
  /** api : /api/profiles · catalog : profil de démo · new : compte créé dans l'app */
  source?: 'api' | 'catalog' | 'new';
  auditExtra?: Omit<AuditPayload, 'wave_om_volume_monthly' | 'woyofal_streak_months' | 'sim_age_years' | 'market_geo_anchor_rate' | 'cash_qr_volume'>;
}

export interface AuditPayload {
  sender_id: string;
  receiver_id: string;
  wave_om_volume_monthly: number;
  wave_om_txns_count: number;
  woyofal_streak_months: number;
  woyofal_delays: number;
  sim_age_years: number;
  market_geo_anchor_rate: number;
  unique_clients_count: number;
  cash_qr_volume: number;
  new_transaction: { amount: number; hour: number; minutes_since_last_txn: number; distance_from_last_txn_km: number };
  recent_events: string[];
}

export interface TimelineEvent {
  event: string;
  impact: string;
  description: string;
  type: 'BONUS' | 'MALUS' | 'NEUTRE' | string;
}

export interface AuditResult {
  decision: string;
  welu_score: number;
  risk_rating: string;
  alert?: string;
  hardware_used: string;
  latency_ms: number;
  xai_shap_breakdown: Record<string, number>;
  timeline_granularity?: {
    score_after_timeline?: number;
    total_bonus: number;
    total_malus: number;
    neutral_events_count: number;
    events_analyzed: TimelineEvent[];
  };
  analyzed_signals?: Record<string, string | number>;
}

export interface CashQrResult {
  status: string;
  receipt_id: string;
  amount_fcfa: number;
  pdf_file: string;
  impact_score: string;
  qr_hash: string;
}

export interface ReceiptResult {
  status: string;
  receipt_id: string;
  pdf_path: string;
  download_url?: string;
}

export interface WhatsAppResult {
  status: string;
  whatsapp_direct_url: string;
  preview_text: string;
}

export interface VoiceResult {
  status: string;
  transcription_wolof?: string;
  structured_data: { type?: string; montant?: number; produit?: string; monnaie?: string };
  ai_voice_response: { wolof: string; francais: string };
}

export interface PaperReceiptResult {
  status: string;
  vision_model?: string;
  extracted_receipt: { fournisseur?: string; montant_total?: number; articles?: string };
  impact_scoring: string;
}

/* ---------- Les 9 routes ---------- */

export const api = {
  health: () => call<Health>('/api/health', undefined, 8_000),
  gpuTelemetry: () => call<GpuTelemetry>('/api/gpu-telemetry', undefined, 8_000),
  profiles: () => call<ApiProfile[]>('/api/profiles'),
  audit: (p: AuditPayload) => call<AuditResult>('/api/audit', p),
  validateCashQr: (p: { merchant_name: string; client_phone: string; amount: number }) => call<CashQrResult>('/api/validate-cash-qr', p),
  receipt: (p: { amount: number; merchant: string; client: string; receipt_id: string }) => call<ReceiptResult>('/api/receipt', p),
  whatsappSend: (p: { phone: string; amount: number; receipt_id: string; merchant: string }) => call<WhatsAppResult>('/api/whatsapp/send', p),
  parseVoice: (text: string) => call<VoiceResult>('/api/parse-voice', { text }, 45_000),
  auditPaperReceipt: (image_url: string) => call<PaperReceiptResult>('/api/audit-paper-receipt', { image_url }, 60_000),
};

/* ---------- Paramètres d'audit par profil ---------- */

/**
 * /api/profiles ne renvoie qu'une partie des variables ; le reste des paramètres d'audit
 * (comptage, contreparties, transaction courante, événements) est fixé ici pour chaque profil de démo.
 */
const EXTRA: Record<string, Omit<AuditPayload, keyof ApiProfile['metrics']>> = {
  'PROF-001': {
    sender_id: 'client_wave_18',
    receiver_id: 'modou_sandaga',
    wave_om_txns_count: 28,
    woyofal_delays: 0,
    unique_clients_count: 24,
    new_transaction: { amount: 15000, hour: 14, minutes_since_last_txn: 60, distance_from_last_txn_km: 0.5 },
    recent_events: ['daily_food_purchase', 'woyofal_ontime', 'cash_qr_client_verified', 'grossiste_stock_wave'],
  },
  'PROF-002': {
    sender_id: 'client_wave_07',
    receiver_id: 'awa_medina',
    wave_om_txns_count: 14,
    woyofal_delays: 1,
    unique_clients_count: 11,
    new_transaction: { amount: 8000, hour: 11, minutes_since_last_txn: 90, distance_from_last_txn_km: 0.8 },
    recent_events: ['daily_food_purchase', 'woyofal_ontime', 'cash_qr_client_verified'],
  },
  'PROF-003': {
    sender_id: 'moussa_collusion',
    receiver_id: 'alioune_collusion',
    wave_om_txns_count: 140,
    woyofal_delays: 3,
    unique_clients_count: 2,
    new_transaction: { amount: 350000, hour: 3, minutes_since_last_txn: 2, distance_from_last_txn_km: 0.1 },
    recent_events: [],
  },
};

export function auditPayloadFor(p: ApiProfile, extraEvents: string[] = [], extraCash = 0): AuditPayload {
  const e = p.auditExtra ?? EXTRA[p.id] ?? EXTRA['PROF-002'];
  return {
    ...e,
    ...p.metrics,
    cash_qr_volume: p.metrics.cash_qr_volume + extraCash,
    recent_events: [...e.recent_events, ...extraEvents],
  };
}

export const isFraud = (r: { risk_rating?: string; tier?: string; alert?: string } | null | undefined) =>
  !!r && (!!r.alert || /CRITIQUE/i.test(r.risk_rating ?? r.tier ?? ''));

export const SHAP_LABELS: Record<string, string> = {
  wave_mobile_money: 'Wave / Orange Money',
  woyofal_electricity: 'Électricité Woyofal',
  telecom_sim: 'Ancienneté SIM',
  geo_market_stability: 'Ancrage marché',
  cash_qr_p2p: 'Cash certifié QR',
  network_diversity: 'Diversité clients',
  penalty_collusion: 'Pénalité collusion',
  penalty_fraud_shield: 'Pénalité bouclier fraude',
};

export const tierLabel = (t: string) =>
  t
    .replace(/_/g, ' ')
    .replace('SOLVABLE A+', 'Solvable A+')
    .replace('PROFIL ÉMERGENT B', 'Profil émergent B')
    .replace(/RISQUE CRITIQUE/, 'Risque critique');
