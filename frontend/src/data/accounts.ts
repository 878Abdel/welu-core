// ─────────────────────────────────────────────────────────────
// DONNÉES SIMULÉES. Comptes de démonstration de l'app client :
// un par activité professionnelle, et un particulier.
// ─────────────────────────────────────────────────────────────
import { profiles } from './profiles';
import { prospects } from './prospects';
import type { Activity, LoanType, MerchantProfile, SalePreset, Segment } from './types';

export const SEGMENTS: { id: Segment; label: string; hint: string }[] = [
  { id: 'pro', label: 'Professionnel', hint: 'J’exerce une activité : commerce, transport, artisanat…' },
  { id: 'particulier', label: 'Particulier', hint: 'Je veux épargner, gérer mon argent ou emprunter pour mon foyer.' },
];

/** Activités proposées à la connexion : seules ces cases sont cliquables. */
export const ACTIVITIES: { id: Activity; label: string; hint: string; profileId: string }[] = [
  { id: 'commerce', label: 'Commerçant(e)', hint: 'Boutique, marché', profileId: 'awa' },
  { id: 'transport', label: 'Chauffeur', hint: 'Taxi, moto, car rapide', profileId: 'modou' },
  { id: 'artisanat', label: 'Artisan', hint: 'Couture, menuiserie', profileId: 'ousmane' },
  { id: 'restauration', label: 'Restauration', hint: 'Gargote, dibiterie', profileId: 'aminata' },
  { id: 'agriculture', label: 'Agriculture', hint: 'Maraîchage, élevage', profileId: 'mariama' },
  { id: 'peche', label: 'Pêche', hint: 'Mareyage, poissonnerie', profileId: 'seynabou' },
];

export const PARTICULIER_PROFILE = 'fatou';

export const LOAN_TYPES: { id: LoanType; label: string; hint: string; months: number; segments: Segment[] }[] = [
  { id: 'construction', label: 'Construire ma maison', hint: 'Briques, ciment, main-d’œuvre', months: 24, segments: ['pro', 'particulier'] },
  { id: 'logement', label: 'Acheter un logement', hint: 'Terrain ou maison', months: 36, segments: ['pro', 'particulier'] },
  { id: 'tresorerie', label: 'Prêt d’argent', hint: 'Besoin ponctuel, stock', months: 6, segments: ['pro', 'particulier'] },
  { id: 'equipement', label: 'Équipement de travail', hint: 'Machine, étal, frigo', months: 12, segments: ['pro'] },
  { id: 'vehicule', label: 'Véhicule', hint: 'Moto, taxi, charrette', months: 18, segments: ['pro'] },
];

export const loanLabel = (t: LoanType) => LOAN_TYPES.find((l) => l.id === t)?.label ?? t;

const SALES: Record<Activity, SalePreset[]> = {
  commerce: [{ label: 'Vente boutique', amount: 12500 }, { label: 'Vente en gros', amount: 36000 }],
  transport: [{ label: 'Course Parcelles → Plateau', amount: 2500 }, { label: 'Course HLM → Sandaga', amount: 1500 }, { label: 'Course aéroport', amount: 6000 }],
  artisanat: [{ label: 'Commande table', amount: 45000 }, { label: 'Réparation porte', amount: 15000 }],
  restauration: [{ label: 'Plat du jour × 4', amount: 6000 }, { label: 'Commande bureau', amount: 18000 }],
  agriculture: [{ label: 'Caisse d’oignons', amount: 14000 }, { label: 'Sac de choux', amount: 9000 }],
  peche: [{ label: 'Caisse de thiof', amount: 35000 }, { label: 'Sardinelles · 10 kg', amount: 8000 }],
};

const SUPPLIER: Record<Activity, SalePreset> = {
  commerce: { label: 'Grossiste · Colobane', amount: 150000 },
  transport: { label: 'Station-service', amount: 12000 },
  artisanat: { label: 'Dépôt de bois', amount: 85000 },
  restauration: { label: 'Marché Tilène', amount: 42000 },
  agriculture: { label: 'Vendeur d’intrants', amount: 60000 },
  peche: { label: 'Fabrique de glace', amount: 7500 },
};

/** Profil complet d'un compte de démo, construit à partir de sa fiche prospect. */
function build(id: string): MerchantProfile | undefined {
  const p = prospects.find((x) => x.id === id);
  if (!p) return undefined;
  const pro = p.segment === 'pro';
  const sales = pro && p.activity ? SALES[p.activity] : [];
  const transactions = pro
    ? sales.map((s, i) => ({ id: `${id}-${i}`, label: s.label, amount: s.amount, channel: 'cash' as const, certified: true, time: `${10 - i}:${15 + i * 7}` }))
    : [
        { id: `${id}-1`, label: 'Transfert reçu', amount: 30000, channel: 'mobile_money' as const, certified: false, time: '09:40' },
        { id: `${id}-2`, label: 'Recharge électricité', amount: -5000, channel: 'mobile_money' as const, certified: true, time: 'Hier' },
        { id: `${id}-3`, label: 'Cotisation tontine', amount: -10000, channel: 'mobile_money' as const, certified: true, time: 'Lun.' },
      ];
  return {
    id,
    segment: p.segment,
    activity: p.activity,
    dossier: p.dossier,
    merchantCode: `WL-${p.dossier.slice(-4)}`,
    name: p.name,
    trade: p.trade,
    area: p.area,
    location: `${p.area}, Dakar`,
    activeSince: 2020,
    contributions: p.contributions,
    transactions,
    salePresets: sales.length ? sales : [{ label: 'Transfert reçu', amount: 15000 }],
    scanPreset: pro && p.activity ? SUPPLIER[p.activity] : { label: 'Boutique de quartier', amount: 5000 },
    flows: { windowDays: 30, nodes: [], edges: [] },
    finances: p.finances,
    strengths: p.strengths,
  };
}

export const findAccount = (id: string): MerchantProfile | undefined => profiles.find((x) => x.id === id) ?? build(id);
