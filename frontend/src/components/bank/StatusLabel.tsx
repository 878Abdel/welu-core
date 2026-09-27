import { AnimatePresence, motion } from 'framer-motion';
import { ease } from '../../motion/easings';

interface Props {
  status: 'invisible' | 'bankable' | 'consolidate' | 'frozen';
}

const COPY = {
  invisible: { text: 'Invisible pour le système bancaire', dot: 'border border-dashed border-muted', color: 'text-muted' },
  bankable: { text: 'Profil bancarisable', dot: 'bg-fg', color: 'text-fg' },
  consolidate: { text: 'Profil à consolider', dot: 'border border-fg', color: 'text-fg' },
  frozen: { text: 'Score gelé · revue requise', dot: 'bg-alert', color: 'text-alert' },
};

export function StatusLabel({ status }: Props) {
  const c = COPY[status];
  return (
    // Les deux libellés partagent la même cellule de grille pendant le fondu : pas de saut de mise en page.
    <div className="grid" aria-live="polite">
      <AnimatePresence initial={false}>
        <motion.p
          key={status}
          className={`col-start-1 row-start-1 flex items-start gap-2 text-[13px] leading-[18px] font-medium ${c.color}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: ease.settle }}
        >
          <span className={`mt-[5px] inline-block size-2 shrink-0 rounded-full ${c.dot}`} />
          {c.text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
