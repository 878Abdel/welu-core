export type Bezier = [number, number, number, number];

// Aucune courbe par défaut : chacune a un rôle précis.
export const ease = {
  /** Arrive vite, se pose doucement. Entrées d'éléments. */
  settle: [0.16, 1, 0.3, 1],
  /** Prend de la vitesse. L'impulsion quitte le téléphone. */
  accelerate: [0.6, 0, 0.9, 0.4],
  /** Freine avant l'impact. L'impulsion arrive sur la console. */
  decelerate: [0.1, 0.6, 0.2, 1],
  /** Mouvement régulier. Le chevron qui suit un flux. */
  glide: [0.45, 0.05, 0.4, 0.95],
  /** Léger dépassement. L'anse du cadenas qui se ferme. */
  snap: [0.3, 1.5, 0.55, 1],
} satisfies Record<string, Bezier>;
