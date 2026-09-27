import type { SpringOptions, Transition } from 'framer-motion';

/** Compteurs numériques : doit se stabiliser entre deux paliers de la matérialisation (700 ms). */
export const counterSpring: SpringOptions = { stiffness: 90, damping: 20, mass: 1 };

/** Brique posée : sous-amortie pour un rebond unique et léger. */
export const brickSpring: Transition = { type: 'spring', stiffness: 520, damping: 17, mass: 0.9 };

/** Ombre portée : lente, elle suit la maison sans la devancer. */
export const shadowSpring: Transition = { type: 'spring', stiffness: 70, damping: 20 };
