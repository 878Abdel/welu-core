import { motion } from 'framer-motion';
import { number } from '../../lib/format';
import { ease } from '../../motion/easings';
import { FRAUD } from '../../motion/timeline';
import type { Point } from '../../state/useWelu';

interface Props {
  from: Point;
  to: Point;
  amount: number;
  count: number;
  /** Arête du cycle frauduleux : tracée tiret par tiret, dans le sens du flux. */
  cycle?: { step: number; delayMs: number; reduced: boolean; center: Point };
}

const R = 17;

export function FlowEdge({ from, to, amount, count, cycle }: Props) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const a = { x: from.x + ux * R, y: from.y + uy * R };
  const b = { x: to.x - ux * (R + 4), y: to.y - uy * (R + 4) };
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  // Étiquette décalée perpendiculairement pour ne pas couvrir le trait.
  // Cycle : montant à l'extérieur du triangle, numéro d'ordre à l'intérieur.
  const c = cycle?.center;
  const side = c && (-uy) * (mid.x - c.x) + ux * (mid.y - c.y) < 0 ? -1 : 1;
  const nx = -uy * side;
  const ny = ux * side;
  const label = { x: mid.x + nx * 13, y: mid.y + ny * 13 };
  const badge = { x: mid.x - nx * 12, y: mid.y - ny * 12 };
  const anchor = Math.abs(nx) < 0.35 ? 'middle' : nx > 0 ? 'start' : 'end';
  const text = `${number(amount)} × ${count}`;

  if (!cycle) {
    return (
      <g>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--color-faint)" strokeWidth={1} strokeDasharray="2 3" />
        <Arrow at={b} angle={angle} color="var(--color-faint)" />
        <text x={label.x} y={label.y} textAnchor={anchor} dominantBaseline="middle" className="fill-muted text-[9.5px]">
          {text}
        </text>
      </g>
    );
  }

  const { step, delayMs, reduced } = cycle;
  const d = (ms: number) => (reduced ? 0 : (delayMs + ms) / 1000);
  const n = FRAUD.dashes;
  const traceEnd = n * FRAUD.dashStagger;

  return (
    <g>
      {Array.from({ length: n }, (_, k) => {
        const t0 = k / n;
        const t1 = (k + 0.7) / n;
        return (
          <motion.line
            key={k}
            x1={a.x + (b.x - a.x) * t0}
            y1={a.y + (b.y - a.y) * t0}
            x2={a.x + (b.x - a.x) * t1}
            y2={a.y + (b.y - a.y) * t1}
            stroke="var(--color-alert)"
            strokeWidth={1.5}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.08, delay: d(k * FRAUD.dashStagger) }}
          />
        );
      })}
      {!reduced && (
        // Chevron qui parcourt l'arête : il montre le sens du flux pendant le tracé.
        <motion.g
          initial={{ x: a.x, y: a.y, opacity: 0 }}
          animate={{ x: [a.x, b.x], y: [a.y, b.y], opacity: [1, 1, 0] }}
          transition={{ duration: traceEnd / 1000, ease: ease.glide, delay: d(0), opacity: { times: [0, 0.9, 1], duration: traceEnd / 1000, delay: d(0) } }}
        >
          <polygon points="-4,-3.5 3,0 -4,3.5" fill="var(--color-alert)" transform={`rotate(${angle})`} />
        </motion.g>
      )}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12, delay: d(traceEnd) }}>
        <Arrow at={b} angle={angle} color="var(--color-alert)" />
        <text x={label.x} y={label.y} textAnchor={anchor} dominantBaseline="middle" className="fill-alert text-[9.5px]">
          {text}
        </text>
        {/* Numéro d'ordre : le sens du cycle reste lisible sans aucun mouvement. */}
        <circle cx={badge.x} cy={badge.y} r={6} fill="var(--color-bg)" stroke="var(--color-alert)" />
        <text
          x={badge.x}
          y={badge.y + 0.5}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-alert text-[7.5px] font-semibold"
        >
          {step}
        </text>
      </motion.g>
    </g>
  );
}

function Arrow({ at, angle, color }: { at: Point; angle: number; color: string }) {
  const r = (angle * Math.PI) / 180;
  const tip = { x: at.x + Math.cos(r) * 3, y: at.y + Math.sin(r) * 3 };
  return <polygon points="-5,-3.5 1,0 -5,3.5" fill={color} transform={`translate(${tip.x} ${tip.y}) rotate(${angle})`} />;
}
