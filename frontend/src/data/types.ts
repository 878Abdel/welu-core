// Contrat de données partagé avec le futur backend FastAPI.
// Chaque interface ici correspondra à un schéma Pydantic côté serveur.

/** D'où vient la donnée affichée. L'interface l'affiche toujours. */
export type SourceKind = 'mock' | 'api';

export type ContributionKey = 'geo_anchor' | 'mobile_money' | 'electricity' | 'cash_certified' | 'savings' | 'line_age';

/** Deux publics : ceux qui exercent une activité et les particuliers. */
export type Segment = 'pro' | 'particulier';

export type Activity = 'commerce' | 'transport' | 'artisanat' | 'restauration' | 'agriculture' | 'peche';

export type LoanType = 'construction' | 'logement' | 'tresorerie' | 'equipement' | 'vehicule';

export interface LoanRequest {
  type: LoanType;
  amount: number;
  months: number;
  time: string;
}

/** Contribution d'une variable au score (≈ pred_contribs de XGBoost). */
export interface Contribution {
  key: ContributionKey;
  label: string;
  points: number;
  /** La donnée brute qui justifie la contribution, lisible par un analyste. */
  evidence: string;
}

export type Channel = 'cash' | 'mobile_money';

export interface Transaction {
  id: string;
  label: string;
  amount: number;
  channel: Channel;
  /** Vente cash confirmée par le client (reçu SMS). */
  certified: boolean;
  time: string;
}

export interface SalePreset {
  label: string;
  amount: number;
}

export interface FlowNode {
  id: string;
  label: string;
  sublabel?: string;
  role: 'merchant' | 'counterparty';
  /** Position dans le graphe (repère 420 × 200). */
  x: number;
  y: number;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  /** Montant par occurrence, en FCFA. */
  amount: number;
  /** Nombre d'occurrences sur la fenêtre observée. */
  count: number;
}

export interface FlowGraph {
  windowDays: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

/** Revenus et charges mensuels estimés à partir des flux observés. */
export interface Finances {
  revenue: number;
  charges: { label: string; amount: number }[];
}

export interface Advice {
  text: string;
  /** Action proposée dans l'app client. */
  action: { label: string; target: 'qr' | 'history' | 'loan' };
}

export interface MerchantProfile {
  id: string;
  segment: Segment;
  activity?: Activity;
  dossier: string;
  /** Identifiant encodé dans le QR du commerçant. */
  merchantCode: string;
  area: string;
  name: string;
  trade: string;
  location: string;
  activeSince: number;
  /** Ordre d'arrivée lors de la matérialisation = ordre de la décomposition XAI. */
  contributions: Contribution[];
  transactions: Transaction[];
  salePresets: SalePreset[];
  /** Paiement fournisseur détecté par le scanner (démo). */
  scanPreset: SalePreset;
  flows: FlowGraph;
  finances: Finances;
  strengths: string[];
  advice?: Advice;
}

/** Commerçant vu par la banque dans la liste des clients probables. */
export interface Prospect {
  id: string;
  segment: Segment;
  activity?: Activity;
  /** Demande de prêt envoyée depuis l'app client. */
  request?: LoanRequest;
  name: string;
  trade: string;
  area: string;
  dossier: string;
  contributions: Contribution[];
  strengths: string[];
  finances: Finances;
  /** Profil détaillé disponible (graphe de flux analysable). */
  profileId?: string;
  /** Flux inhabituels signalés : une analyse est recommandée avant toute offre. */
  flowsFlagged?: boolean;
}

export interface ProfileSummary {
  id: string;
  name: string;
  trade: string;
}

export interface ScoreResult {
  score: number;
  contributions: Contribution[];
  frozen: boolean;
  source: SourceKind;
}

export interface SaleResult {
  transaction: Transaction;
  result: ScoreResult;
}

export interface FraudAnalysis {
  /** Cycles orientés, chacun commençant par le commerçant (≈ networkx.simple_cycles). */
  cycles: string[][];
  /** Points de score attribués à tort, par variable. */
  inflated: { key: ContributionKey; points: number }[];
  /** Montant total ayant circulé dans les cycles. */
  recirculated: number;
  source: SourceKind;
}
