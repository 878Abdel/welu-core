import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useMotionPrefs } from '../../motion/MotionPrefs';
import { shadowSpring } from '../../motion/springs';
import { HOUSE } from '../../motion/timeline';
import { Brick } from './Brick';
import { BRICKS, GROUND, HOUSE_LEFT, HOUSE_RIGHT, ROOF_TOP, tierOf } from './houseLayout';

interface Props {
  score: number;
  /** Points gonflés par la fraude : les briques correspondantes passent en contour rouge. */
  taintedPoints?: number;
  resetKey?: unknown;
  className?: string;
}

const SHADOW_MAX = 230;
const SHADOW_REACH = 70;

/** Le dessin seul : briques posées une à une, ombre portée qui s'allonge avec la hauteur. */
export function HouseSvg({ score, taintedPoints = 0, resetKey, className = 'w-full' }: Props) {
  const { reduced } = useMotionPrefs();
  const target = BRICKS.filter((b) => score >= b.threshold - 1e-9).length;
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  shownRef.current = shown;

  useEffect(() => setShown(0), [resetKey]);

  // Pose une brique à la fois à cadence fixe : un vrai stagger, quelle que soit la vitesse du score.
  // Calé sur le temps écoulé (rAF) : si l'onglet a été masqué, la maison rattrape son retard d'un coup.
  useEffect(() => {
    const start = shownRef.current;
    if (reduced || target <= start) return setShown(target);
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const n = Math.min(target, start + Math.floor((now - t0) / HOUSE.cadence) + 1);
      setShown(n);
      if (n < target) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);

  const visible = BRICKS.slice(0, shown);
  const top = visible.length ? Math.min(...visible.map((b) => b.y)) : GROUND;
  const height = (GROUND - top) / (GROUND - ROOF_TOP);
  // Soleil bas à gauche : plus la maison monte, plus son ombre s'allonge sur le sol.
  const shadowWidth = visible.length ? HOUSE_RIGHT - HOUSE_LEFT + height * SHADOW_REACH : 0;
  const taintFloor = score - taintedPoints;

  return (
    <svg viewBox="0 0 260 172" className={className} role="img" aria-label={`Maison construite à ${score} sur 100`}>
      <line x1={0} x2={260} y1={GROUND + 0.5} y2={GROUND + 0.5} stroke="var(--color-tint-2)" strokeWidth={1} />
      <motion.rect
        x={HOUSE_LEFT}
        y={GROUND + 1.5}
        width={SHADOW_MAX}
        height={5}
        rx={2}
        fill="var(--color-tint)"
        style={{ originX: 0 }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: shadowWidth / SHADOW_MAX }}
        transition={shadowSpring}
      />
      {visible.map((b) => (
        <Brick key={b.id} brick={b} tainted={taintedPoints > 0 && b.threshold > taintFloor} />
      ))}
    </svg>
  );
}

/** Version légendée, utilisée dans la vue démo. */
export function BrickHouse(props: Props) {
  const tier = tierOf(props.score);
  return (
    <figure className="flex h-full min-w-0 flex-col justify-end gap-2 px-5 pt-4 pb-4">
      <div className="flex items-baseline justify-between">
        <figcaption className="eyebrow">Projet · sa maison</figcaption>
        <span className="text-[11px] text-muted">{tier ? `Chantier : ${tier.label.toLowerCase()}` : 'Maison achevée'}</span>
      </div>
      <HouseSvg {...props} />
    </figure>
  );
}
