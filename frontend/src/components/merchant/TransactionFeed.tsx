import { AnimatePresence, motion } from 'framer-motion';
import type { Ref } from 'react';
import type { Transaction } from '../../data/types';
import { number } from '../../lib/format';
import { ease } from '../../motion/easings';

interface Props {
  transactions: Transaction[];
  /** Posé sur la première ligne : c'est de là que part l'impulsion. */
  originRef: Ref<HTMLLIElement>;
}

export function TransactionFeed({ transactions, originRef }: Props) {
  return (
    <section className="flex min-h-0 flex-1 flex-col px-4">
      <h3 className="eyebrow pb-2">Aujourd’hui</h3>
      <ul className="min-h-0 flex-1 overflow-hidden">
        <AnimatePresence initial={false}>
          {transactions.map((t, i) => (
            <motion.li
              key={t.id}
              ref={i === 0 ? originRef : undefined}
              layout="position"
              className="flex items-center gap-3 border-t border-line py-2.5"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.26, ease: ease.settle }}
            >
              <span className="w-9 shrink-0 text-[10.5px] text-muted">{t.time}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px]">{t.label}</span>
                <span className="block text-[10px] text-muted">
                  {t.channel === 'cash' ? (t.certified ? 'Cash · confirmé par le client' : 'Cash') : 'Mobile money'}
                </span>
              </span>
              <span className="shrink-0 text-[12px] font-medium">{number(t.amount)}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
