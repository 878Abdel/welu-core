import { motion } from 'framer-motion';
import type { Contribution, ContributionKey } from '../../data/types';
import { ease } from '../../motion/easings';
import { SimTag } from '../ui/SourceBadge';

interface Props {
  contributions: Contribution[];
  revealed: number;
  mock: boolean;
  impact: { id: number; key: ContributionKey } | null;
}

/** Les données financières du commerçant, qui arrivent une par une. */
export function DataIntake({ contributions, revealed, mock, impact }: Props) {
  return (
    <ol className="flex flex-col">
      {contributions.map((c, i) => (
        <li key={c.key} className="relative h-12 border-b border-line last:border-b-0">
          {i < revealed ? (
            <motion.div
              className="flex h-full items-center gap-4"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, ease: ease.settle }}
            >
              <span className="w-5 text-[11px] text-muted">{String(i + 1).padStart(2, '0')}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px]">{c.label}</span>
                <span className="block truncate text-[11px] text-muted">
                  {c.evidence} {mock && <SimTag />}
                </span>
              </span>
              <span className="text-[13px] font-medium">+{c.points}</span>
            </motion.div>
          ) : (
            <div className="flex h-full items-center gap-4 text-dim">
              <span className="w-5 text-[11px]">{String(i + 1).padStart(2, '0')}</span>
              <span className="h-2 flex-1 rounded-sm border border-dashed border-dim" />
              <span className="text-[11px]">en attente</span>
            </div>
          )}
          {impact?.key === c.key && <RowFlash key={impact.id} />}
        </li>
      ))}
    </ol>
  );
}

export function RowFlash() {
  return (
    <motion.span
      className="pointer-events-none absolute inset-0 bg-violet"
      initial={{ opacity: 0.14 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: ease.settle }}
    />
  );
}
