import { AnimatePresence, motion } from 'framer-motion';
import { ease } from '../../motion/easings';
import type { LogEntry } from '../../state/useWelu';

const TONE = { neutral: 'text-muted', positive: 'text-fg', alert: 'text-alert' };

/** Journal horodaté (heure réelle de l'appareil). Rend la causalité lisible même sans animation. */
export function ActivityLog({ entries }: { entries: LogEntry[] }) {
  return (
    <section className="flex min-h-0 flex-col" aria-label="Journal">
      <h2 className="eyebrow px-5 pt-4 pb-3">Journal</h2>
      <ol className="min-h-0 flex-1 overflow-hidden px-5" aria-live="polite">
        <AnimatePresence initial={false}>
          {entries.map((e) => (
            <motion.li
              key={e.id}
              layout="position"
              className="flex gap-3 py-1.5 text-[11.5px] leading-[1.45]"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: ease.settle }}
            >
              <time className="shrink-0 text-dim">{e.time}</time>
              <span className={TONE[e.tone]}>{e.text}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </section>
  );
}
