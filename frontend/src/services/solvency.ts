/** Seuil d'éligibilité affiché sur la jauge (rouge < 50 ≤ jaune < 70 ≤ vert). */
export const SOLVENCY_RULES = { minScore: 70 } as const;

export type Zone = 'low' | 'warn' | 'ok';

export const zoneOf = (score: number): Zone => (score >= SOLVENCY_RULES.minScore ? 'ok' : score >= 50 ? 'warn' : 'low');
