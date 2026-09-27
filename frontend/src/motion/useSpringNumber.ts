import { useMotionValueEvent, useSpring, type MotionValue } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { counterSpring } from './springs';
import { useMotionPrefs } from './MotionPrefs';

/**
 * Compteur piloté par un spring (jamais une interpolation linéaire).
 * `resetKey` : quand il change, la valeur saute sans animer (rejouer, changer de profil).
 * `initial` : valeur de départ au montage (0 pour faire monter le score à l'ouverture).
 */
export function useSpringNumber(
  target: number,
  resetKey?: unknown,
  initial?: number,
): { mv: MotionValue<number>; current: number } {
  const { reduced } = useMotionPrefs();
  const start = reduced || initial === undefined ? target : initial;
  const mv = useSpring(start, counterSpring);
  const [current, setCurrent] = useState(Math.round(start));

  useMotionValueEvent(mv, 'change', (v) => setCurrent(Math.round(v)));

  const lastKey = useRef(resetKey);
  useEffect(() => {
    if (lastKey.current === resetKey) return;
    lastKey.current = resetKey;
    mv.jump(target);
    setCurrent(Math.round(target));
  }, [resetKey]);

  useEffect(() => {
    if (reduced) {
      mv.jump(target);
      setCurrent(Math.round(target));
    } else {
      mv.set(target);
    }
  }, [target, reduced, mv]);

  return { mv, current };
}
