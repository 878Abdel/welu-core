import type { Contribution, Finances } from '../data/types';

// Règles de solvabilité simulées, affichées telles quelles dans la console banque.
// Partagées avec l'app client pour que l'offre vue des deux côtés soit identique.
export const SOLVENCY_RULES = {
  /** Part du revenu net mobilisable pour une mensualité. */
  capacityShare: 0.4,
  /** Marge de sécurité : la mensualité n'utilise que 70 % de la capacité. */
  safety: 0.7,
  months: 6,
  /** Coût total du crédit sur la durée (indicatif). */
  cost: 0.05,
  veryGoodMargin: 0.2,
  goodMargin: 0.13,
  minScore: 70,
  roundTo: 50000,
};

export type SolvencyLabel = 'Très solvable' | 'Solvable' | 'Fragile';
export type OfferStatus = 'Éligible' | 'À examiner' | 'À consolider' | 'À vérifier' | 'Gelé';

export interface Solvency {
  net: number;
  margin: number;
  capacity: number;
  loan: number;
  monthly: number;
  effort: number;
  label: SolvencyLabel;
}

export const scoreOfContributions = (cs: Contribution[]) => cs.reduce((s, c) => s + c.points, 0);

export function solvency(f: Finances): Solvency {
  const R = SOLVENCY_RULES;
  const net = f.revenue - f.charges.reduce((s, c) => s + c.amount, 0);
  const margin = net / f.revenue;
  const capacity = net * R.capacityShare;
  const loan = Math.max(0, Math.floor((capacity * R.safety * R.months) / R.roundTo) * R.roundTo);
  const monthly = (loan * (1 + R.cost)) / R.months;
  const label: SolvencyLabel = margin >= R.veryGoodMargin ? 'Très solvable' : margin >= R.goodMargin ? 'Solvable' : 'Fragile';
  return { net, margin, capacity, loan, monthly, effort: net > 0 ? monthly / net : 1, label };
}

/** Montant finançable pour une durée donnée (même règle, durée propre au type de prêt). */
export function offerFor(f: Finances, months: number) {
  const R = SOLVENCY_RULES;
  const s = solvency(f);
  const amount = Math.max(0, Math.floor((s.capacity * R.safety * months) / R.roundTo) * R.roundTo);
  return { amount, months, monthly: (amount * (1 + R.cost * (months / R.months))) / months };
}

/** Zones de la jauge : rouge sous 50, jaune jusqu'au seuil, vert à partir du seuil d'éligibilité. */
export const zoneOf = (score: number) => (score >= SOLVENCY_RULES.minScore ? 'ok' : score >= 50 ? 'warn' : 'low') as 'ok' | 'warn' | 'low';

export function offerStatus(score: number, s: Solvency, opts: { frozen?: boolean; flagged?: boolean }): OfferStatus {
  if (opts.frozen) return 'Gelé';
  if (opts.flagged) return 'À vérifier';
  if (score < SOLVENCY_RULES.minScore) return 'À consolider';
  if (s.label === 'Fragile') return 'À examiner';
  return 'Éligible';
}
