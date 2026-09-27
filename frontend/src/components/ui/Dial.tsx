import type { ReactNode } from 'react';
import { useSpringNumber } from '../../motion/useSpringNumber';
import { SOLVENCY_RULES, zoneOf } from '../../services/solvency';
import { MotionNumber } from '../bank/AnimatedNumber';

const ZONE_COLOR = { low: 'var(--color-alert)', warn: 'var(--color-warn)', ok: 'var(--color-ok)' };

interface Props {
  value: number;
  size?: number;
  /** Points gonflés par la fraude : les graduations correspondantes passent en rouge. */
  taintedPoints?: number;
  frozen?: boolean;
  resetKey?: unknown;
  /** Démarre à 0 et monte jusqu'à la valeur au premier affichage. */
  fromZero?: boolean;
  caption?: ReactNode;
  numberClass?: string;
  /** Jauge d'éligibilité : l'arc prend la couleur de la zone atteinte (rouge, jaune, vert) et un repère marque le seuil. */
  zones?: boolean;
}

const TICKS = 100;

/** Cadran de score : 100 graduations sur 270°, allumées en opacité ; chiffre animé par spring. */
export function Dial({ value, size = 120, taintedPoints = 0, frozen = false, resetKey, fromZero = false, caption, numberClass = '', zones = false }: Props) {
  const { mv, current } = useSpringNumber(value, resetKey, fromZero ? 0 : undefined);
  const c = size / 2;
  const r2 = size * 0.46;
  const taintFrom = value - taintedPoints;
  // La couleur suit le score animé : on voit l'arc passer du rouge au jaune puis au vert.
  const litColor = zones ? ZONE_COLOR[zoneOf(current)] : 'var(--color-violet-strong)';
  const th = SOLVENCY_RULES.minScore;
  const thA = ((-135 + (th * 270) / (TICKS - 1)) * Math.PI) / 180;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden>
        {Array.from({ length: TICKS }, (_, i) => {
          const a = ((-135 + (i * 270) / (TICKS - 1)) * Math.PI) / 180;
          const r1 = size * (i % 10 === 0 ? 0.36 : 0.4);
          const p = { x1: c + Math.sin(a) * r1, y1: c - Math.cos(a) * r1, x2: c + Math.sin(a) * r2, y2: c - Math.cos(a) * r2 };
          const bad = frozen && taintedPoints > 0 && i >= taintFrom && i < value;
          const w = Math.max(1, size / 110);
          return (
            <g key={i}>
              <line {...p} stroke="var(--color-line)" strokeWidth={w} strokeLinecap="round" />
              <line
                {...p}
                className="tick"
                stroke={bad ? 'var(--color-alert)' : litColor}
                strokeWidth={w}
                strokeLinecap="round"
                style={{ opacity: i < current ? 1 : 0 }}
              />
            </g>
          );
        })}
        {zones && (
          // Repère du seuil d'éligibilité
          <line
            x1={c + Math.sin(thA) * size * 0.3}
            y1={c - Math.cos(thA) * size * 0.3}
            x2={c + Math.sin(thA) * size * 0.5}
            y2={c - Math.cos(thA) * size * 0.5}
            stroke="var(--color-ink)"
            strokeWidth={Math.max(1.5, size / 70)}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <MotionNumber
          mv={mv}
          className={`leading-none font-semibold tracking-[-0.03em] ${frozen ? 'text-alert' : 'text-ink'} ${numberClass}`}
        />
        {caption && <span className="mt-1 text-[10px] text-muted">{caption}</span>}
      </div>
    </div>
  );
}
