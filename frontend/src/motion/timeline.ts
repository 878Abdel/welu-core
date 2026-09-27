// Toutes les durées des séquences narratives, en millisecondes.
// Modifier ici, jamais dans les composants.

/** ① Matérialisation : 4 sources de données, puis bascule « bancarisable ». */
export const MATERIALIZE = {
  steps: [400, 1100, 1800, 2500],
  settle: 3200,
} as const;

/** ② Propagation : naissance, franchissement de la séparation, impact. */
export const PULSE = {
  spawn: 120,
  cross: 340,
  impact: 620,
} as const;

/** ③ Décomposition XAI. */
export const XAI = {
  build: 200,
  segment: 320,
  stagger: 60,
  rowHeight: 44,
} as const;

/** ④ Maison : cadence de pose, une brique à la fois. */
export const HOUSE = {
  cadence: 26,
} as const;

/** Fraude : nœuds, tracé du cycle arête par arête, verrouillage. */
export const FRAUD = {
  nodeStagger: 60,
  traceStart: 600,
  dashes: 12,
  dashStagger: 30,
  edgePause: 40,
  pulse: 1200,
} as const;

export const edgeTraceMs = FRAUD.dashes * FRAUD.dashStagger + FRAUD.edgePause;
