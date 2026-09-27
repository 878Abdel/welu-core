import { motion } from 'framer-motion';
import { ease } from '../../motion/easings';

// Quatre zones, remplies de bas en haut : une par source de données.
// Ancrage → jambes, mobile money → torse, électricité → épaules et bras, cash → tête.
const ZONES = [
  'M44 138H58V196H46Z M62 138H76L74 196H62Z',
  'M42 80H78L76 134H44Z',
  'M36 56H84L104 118L93 121L80 78H40L27 121L16 118Z',
  'M60 13a17 17 0 1 1 0 34a17 17 0 1 1 0-34Z',
];

interface Props {
  revealed: number;
  solid: boolean;
  frozen: boolean;
}

export function MerchantSilhouette({ revealed, solid, frozen }: Props) {
  return (
    <svg viewBox="0 0 120 200" className="h-full w-auto" aria-hidden>
      {/* Contour fantôme : le commerçant tel que le voit une banque classique. */}
      <motion.g
        fill="none"
        stroke="var(--color-muted)"
        strokeWidth={1}
        strokeDasharray="3 3"
        initial={{ opacity: 0 }}
        animate={{ opacity: solid ? 0 : 0.8 }}
        transition={{ duration: solid ? 0.4 : 0.3, ease: ease.settle }}
      >
        {ZONES.map((d) => (
          <path key={d} d={d} />
        ))}
      </motion.g>
      {ZONES.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          fill={frozen ? 'var(--color-faint)' : 'var(--color-violet-strong)'}
          initial={{ opacity: 0 }}
          animate={{ opacity: revealed > i ? 1 : 0 }}
          transition={{ duration: 0.32, ease: ease.settle }}
        />
      ))}
    </svg>
  );
}
