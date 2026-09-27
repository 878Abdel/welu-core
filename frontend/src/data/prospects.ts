// ─────────────────────────────────────────────────────────────
// DONNÉES SIMULÉES. Clients probables vus par la banque.
// Awa et Moussa reprennent leurs profils détaillés ; les autres sont fictifs.
// ─────────────────────────────────────────────────────────────
import { profiles } from './profiles';
import type { Contribution, Prospect } from './types';

const c = (geo: number, geoEv: string, momo: number, momoEv: string, elec: number, elecEv: string, cash: number, cashEv: string): Contribution[] => [
  { key: 'geo_anchor', label: 'Ancrage géographique', points: geo, evidence: geoEv },
  { key: 'mobile_money', label: 'Flux mobile money', points: momo, evidence: momoEv },
  { key: 'electricity', label: 'Régularité des recharges d’électricité', points: elec, evidence: elecEv },
  { key: 'cash_certified', label: 'Encaissements cash certifiés', points: cash, evidence: cashEv },
];

/** Particuliers : épargne et ancienneté de la ligne remplacent l'activité commerciale. */
const p = (elec: number, elecEv: string, momo: number, momoEv: string, sav: number, savEv: string, line: number, lineEv: string): Contribution[] => [
  { key: 'electricity', label: 'Régularité des recharges d’électricité', points: elec, evidence: elecEv },
  { key: 'mobile_money', label: 'Flux mobile money', points: momo, evidence: momoEv },
  { key: 'savings', label: 'Épargne (tontine)', points: sav, evidence: savEv },
  { key: 'line_age', label: 'Ancienneté de la ligne', points: line, evidence: lineEv },
];

const fromProfile = (id: string, extra: Partial<Prospect> = {}): Prospect => {
  const p = profiles.find((x) => x.id === id)!;
  return {
    id: p.id,
    segment: p.segment,
    activity: p.activity,
    name: p.name,
    trade: p.trade,
    area: p.area,
    dossier: p.dossier,
    contributions: p.contributions,
    strengths: p.strengths,
    finances: p.finances,
    profileId: p.id,
    ...extra,
  };
};

export const prospects: Prospect[] = [
  fromProfile('awa'),
  {
    id: 'mamadou', segment: 'pro', activity: 'commerce', name: 'Mamadou Fall', trade: 'Quincaillerie', area: 'Thiaroye', dossier: 'SN-DKR-0377',
    contributions: c(15, 'Même emplacement depuis 4 ans', 30, '≈ 2,6 M FCFA / mois', 18, '12 recharges sur 14 mois', 23, '340 ventes certifiées'),
    strengths: ['Ventes certifiées', 'Fournisseurs stables'],
    finances: { revenue: 2600000, charges: [{ label: 'Achats fournisseurs', amount: 1900000 }, { label: 'Loyer', amount: 120000 }, { label: 'Électricité', amount: 30000 }] },
  },
  fromProfile('moussa', { flowsFlagged: true }),
  {
    id: 'aminata', segment: 'pro', activity: 'restauration', name: 'Aminata Sarr', trade: 'Restauration', area: 'Médina', dossier: 'SN-DKR-0291',
    contributions: c(14, 'Même emplacement depuis 5 ans', 26, '≈ 1,2 M FCFA / mois', 24, '14 recharges sur 14 mois', 20, '410 ventes certifiées'),
    strengths: ['Clientèle fidèle', 'Électricité régulière'],
    finances: { revenue: 1200000, charges: [{ label: 'Achats marché', amount: 760000 }, { label: 'Gaz et électricité', amount: 70000 }, { label: 'Aide en cuisine', amount: 50000 }] },
  },
  {
    id: 'ibrahima', segment: 'pro', activity: 'commerce', name: 'Ibrahima Sow', trade: 'Téléphonie', area: 'Petersen', dossier: 'SN-DKR-0456',
    contributions: c(10, 'Même emplacement depuis 2 ans', 36, '≈ 3,1 M FCFA / mois', 15, '10 recharges sur 14 mois', 18, '150 ventes certifiées'),
    strengths: ['Volume mobile money élevé', 'Ventes certifiées'],
    finances: { revenue: 3100000, charges: [{ label: 'Stock téléphones', amount: 2600000 }, { label: 'Loyer', amount: 150000 }, { label: 'Électricité', amount: 10000 }] },
  },
  {
    id: 'khady', segment: 'pro', activity: 'commerce', name: 'Khady Faye', trade: 'Cosmétiques', area: 'HLM', dossier: 'SN-DKR-0503',
    contributions: c(22, 'Même emplacement depuis 9 ans', 22, '≈ 0,9 M FCFA / mois', 16, '11 recharges sur 14 mois', 16, '180 ventes certifiées'),
    strengths: ['Ancrage 9 ans'],
    finances: { revenue: 900000, charges: [{ label: 'Achats produits', amount: 600000 }, { label: 'Électricité', amount: 40000 }] },
  },
  {
    id: 'ousmane', segment: 'pro', activity: 'artisanat', name: 'Ousmane Ba', trade: 'Menuiserie', area: 'Pikine', dossier: 'SN-DKR-0612',
    contributions: c(16, 'Même atelier depuis 7 ans', 20, '≈ 1,5 M FCFA / mois', 13, 'Recharges irrégulières', 22, '60 commandes certifiées'),
    strengths: ['Commandes certifiées'],
    finances: { revenue: 1500000, charges: [{ label: 'Bois et quincaillerie', amount: 1100000 }, { label: 'Apprentis', amount: 150000 }, { label: 'Électricité', amount: 40000 }] },
  },
  {
    id: 'seynabou', segment: 'pro', activity: 'peche', name: 'Seynabou Diallo', trade: 'Poissonnerie', area: 'Soumbédioune', dossier: 'SN-DKR-0640',
    contributions: c(13, 'Même étal depuis 3 ans', 18, '≈ 1,1 M FCFA / mois', 17, '12 recharges sur 14 mois', 20, '520 ventes certifiées'),
    strengths: ['Activité quotidienne'],
    finances: { revenue: 1100000, charges: [{ label: 'Achats au débarquement', amount: 900000 }, { label: 'Glace', amount: 50000 }] },
  },
  {
    id: 'modou', segment: 'pro', activity: 'transport', name: 'Modou Gueye', trade: 'Chauffeur moto-taxi', area: 'Parcelles Assainies', dossier: 'SN-DKR-0701',
    contributions: c(9, 'Même zone de travail depuis 3 ans', 22, '≈ 450 000 FCFA / mois', 12, 'Recharges irrégulières', 21, '380 courses confirmées par QR'),
    strengths: ['Courses certifiées', 'Revenus quotidiens'],
    finances: { revenue: 520000, charges: [{ label: 'Carburant', amount: 180000 }, { label: 'Location de la moto', amount: 150000 }, { label: 'Entretien', amount: 40000 }] },
  },
  {
    id: 'mariama', segment: 'pro', activity: 'agriculture', name: 'Mariama Diouf', trade: 'Maraîchère', area: 'Niayes', dossier: 'SN-THS-0112',
    contributions: c(18, 'Même parcelle depuis 8 ans', 20, '≈ 800 000 FCFA / mois en saison', 11, 'Pompe solaire, peu de recharges', 24, '290 ventes certifiées'),
    strengths: ['Ancrage 8 ans', 'Ventes certifiées'],
    finances: { revenue: 800000, charges: [{ label: 'Semences et intrants', amount: 380000 }, { label: 'Transport au marché', amount: 120000 }] },
  },
  // ── Particuliers ──
  {
    id: 'fatou', segment: 'particulier', name: 'Fatou Sarr', trade: 'Particulière', area: 'Guédiawaye', dossier: 'SN-PAR-0031',
    contributions: p(14, 'Recharges régulières depuis 10 mois', 16, 'Transferts reçus ≈ 90 000 FCFA / mois', 10, 'Tontine depuis 8 mois', 8, 'Même numéro depuis 5 ans'),
    strengths: ['Tontine régulière'],
    finances: { revenue: 120000, charges: [{ label: 'Loyer', amount: 45000 }, { label: 'Dépenses du foyer', amount: 50000 }] },
  },
  {
    id: 'ndeye', segment: 'particulier', name: 'Ndèye Fall', trade: 'Particulière', area: 'Pikine', dossier: 'SN-PAR-0044',
    contributions: p(15, 'Recharges régulières depuis 14 mois', 19, 'Transferts reçus ≈ 150 000 FCFA / mois', 14, 'Tontine depuis 2 ans', 10, 'Même numéro depuis 7 ans'),
    strengths: ['Épargne régulière', 'Ligne ancienne'],
    finances: { revenue: 190000, charges: [{ label: 'Loyer', amount: 60000 }, { label: 'Dépenses du foyer', amount: 80000 }] },
  },
  {
    id: 'cheikh', segment: 'particulier', name: 'Cheikh Diop', trade: 'Particulier', area: 'Yoff', dossier: 'SN-PAR-0058',
    contributions: p(20, 'Recharges régulières depuis 3 ans', 22, 'Revenus reçus ≈ 320 000 FCFA / mois', 18, 'Tontine depuis 4 ans', 12, 'Même numéro depuis 9 ans'),
    strengths: ['Épargne 4 ans', 'Revenus stables'],
    finances: { revenue: 320000, charges: [{ label: 'Loyer', amount: 90000 }, { label: 'Dépenses du foyer', amount: 110000 }] },
  },
];
