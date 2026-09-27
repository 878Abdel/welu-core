import { AnimatePresence, motion, type MotionValue } from 'framer-motion';
import type { Ref } from 'react';
import { ease } from '../../motion/easings';
import { MotionNumber } from './AnimatedNumber';

interface Props {
  mv: MotionValue<number>;
  current: number;
  /** Score cible (non animé), pour situer la zone gonflée. */
  score: number;
  taintedPoints: number;
  frozen: boolean;
  impactId: number | null;
  expanded: boolean;
  disabled: boolean;
  onToggle: () => void;
  ref?: Ref<HTMLDivElement>;
}

const SIZE = 188;
const C = SIZE / 2;
const TICKS = 100;

// 100 graduations sur 270°. Chacune s'allume en opacité : pas d'animation de trait.
const ticks = Array.from({ length: TICKS }, (_, i) => {
  const a = ((-135 + (i * 270) / (TICKS - 1)) * Math.PI) / 180;
  const r1 = i % 10 === 0 ? 72 : 76;
  const r2 = 86;
  return {
    x1: C + Math.sin(a) * r1,
    y1: C - Math.cos(a) * r1,
    x2: C + Math.sin(a) * r2,
    y2: C - Math.cos(a) * r2,
  };
});

export function ScoreDial({ mv, current, score, taintedPoints, frozen, impactId, expanded, disabled, onToggle, ref }: Props) {
  const taintFrom = score - taintedPoints;

  return (
    <div ref={ref} className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-expanded={expanded}
        aria-label={`Score ${current} sur 100. ${expanded ? 'Masquer' : 'Afficher'} la décomposition.`}
        className="group relative block cursor-pointer rounded-full disabled:cursor-default"
        style={{ width: SIZE, height: SIZE }}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0" aria-hidden>
          {ticks.map((t, i) => {
            const lit = i < current;
            const tainted = frozen && taintedPoints > 0 && i >= taintFrom && i < score;
            return (
              <g key={i}>
                <line {...t} stroke="var(--color-line)" strokeWidth={1.25} />
                <line
                  {...t}
                  className="tick"
                  stroke={tainted ? 'var(--color-alert)' : 'var(--color-violet-strong)'}
                  strokeWidth={1.25}
                  style={{ opacity: lit ? 1 : 0 }}
                />
              </g>
            );
          })}
        </svg>

        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence>
            {frozen && (
              <motion.svg
                key="lock"
                viewBox="0 0 14 16"
                className="mb-1 h-4 w-3.5 text-alert"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                aria-hidden
              >
                <motion.path
                  d="M4 7V5a3 3 0 0 1 6 0v2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  initial={{ y: -3 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.12, duration: 0.22, ease: ease.snap }}
                />
                <rect x={2} y={7} width={10} height={8} rx={1} fill="currentColor" />
              </motion.svg>
            )}
          </AnimatePresence>
          <MotionNumber
            mv={mv}
            className={`text-[52px] font-medium leading-none tracking-[-0.03em] ${frozen ? 'text-muted' : 'text-fg'}`}
          />
          <span className="mt-1.5 text-[11px] text-muted">sur 100</span>
          <span className={`mt-2 text-[10px] tracking-[0.14em] uppercase ${frozen ? 'text-alert' : 'text-muted group-enabled:group-hover:text-fg'}`}>
            {frozen ? 'Gelé' : expanded ? 'Masquer' : 'Expliquer ↓'}
          </span>
        </span>

        {/* Impact de l'impulsion : une onde, une seule. */}
        {impactId !== null && (
          <motion.span
            key={impactId}
            className="pointer-events-none absolute inset-0 rounded-full border border-violet-strong"
            initial={{ scale: 0.92, opacity: 0.6 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 0.36, ease: ease.settle }}
          />
        )}
      </button>
    </div>
  );
}
