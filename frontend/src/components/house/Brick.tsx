import { motion } from 'framer-motion';
import { brickSpring } from '../../motion/springs';
import type { BrickSpec } from './houseLayout';

interface Props {
  brick: BrickSpec;
  /** Brique financée par des flux frauduleux : elle perd sa matière, seul son contour reste. */
  tainted: boolean;
}

export function Brick({ brick: b, tainted }: Props) {
  return (
    <motion.g
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ y: brickSpring, opacity: { duration: 0.1 } }}
    >
      {/* Ombre de contact : visible sous la brique qui tombe, elle se pose avec elle. */}
      <rect x={b.x + 1} y={b.y + 1.5} width={b.w} height={b.h} rx={1.5} fill="var(--color-violet-deep)" opacity={0.12} />
      <motion.rect
        x={b.x}
        y={b.y}
        width={b.w}
        height={b.h}
        rx={1.5}
        fill={b.tone}
        animate={{ opacity: tainted ? 0.08 : 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.rect
        x={b.x + 0.5}
        y={b.y + 0.5}
        width={b.w - 1}
        height={b.h - 1}
        rx={1}
        fill="none"
        stroke="var(--color-alert)"
        strokeWidth={1}
        initial={false}
        animate={{ opacity: tainted ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.g>
  );
}
