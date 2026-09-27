import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { ease } from '../../motion/easings';
import type { BankApi } from '../../state/useBank';
import { FraudGraph } from '../fraud/FraudGraph';

/** Analyse des flux en grand : le cycle frauduleux se trace, puis le score se fige. */
export function FlowModal({ api }: { api: BankApi }) {
  const v = api.modal;
  const review = v?.review;

  useEffect(() => {
    if (!v) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && api.closeModal();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [v, api.closeModal]);

  return (
    <AnimatePresence>
      {v && review && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={api.closeModal}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Analyse des flux · ${v.p.name}`}
            className="w-full max-w-[760px] rounded-2xl bg-bg p-6 shadow-[0_30px_80px_-20px_rgba(27,21,48,.35)]"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.28, ease: ease.settle }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="eyebrow">Analyse des flux · {review.profile.flows.windowDays} derniers jours</p>
                <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.01em]">{v.p.name}</h2>
              </div>
              <button type="button" onClick={api.closeModal} className="cursor-pointer rounded-lg px-2 py-1 text-[12.5px] text-muted hover:bg-surface" aria-label="Fermer">
                Fermer · Échap
              </button>
            </div>
            <div className="h-[380px]">
              <FraudGraph graph={review.profile.flows} analysis={review.analysis} stage={review.stage} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
