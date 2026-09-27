import { motion, type Variants } from 'framer-motion';
import type { Contribution, ContributionKey } from '../../data/types';
import { ease } from '../../motion/easings';
import { XAI } from '../../motion/timeline';
import { RowFlash } from './DataIntake';

interface Props {
  contributions: Contribution[];
  inflated: Partial<Record<ContributionKey, number>>;
  impact: { id: number; key: ContributionKey } | null;
}

const ROW = XAI.rowHeight;
const s = (ms: number) => ms / 1000;

// La barre empilée se dessine (scaleX), puis chaque segment descend sur sa ligne
// en gardant sa position horizontale : une cascade qui montre que les parties s'additionnent.
const segment: Variants = {
  hidden: { opacity: 0, scaleX: 0, y: 0 },
  shown: (i: number) => ({
    opacity: 1,
    scaleX: 1,
    y: (i + 1) * ROW,
    transition: {
      opacity: { duration: 0.1, delay: s(i * 20) },
      scaleX: { duration: s(XAI.build), ease: ease.settle, delay: s(i * 20) },
      y: { duration: s(XAI.segment), ease: ease.settle, delay: s(XAI.build + 80 + i * XAI.stagger) },
    },
  }),
  exit: (i: number) => ({
    y: 0,
    opacity: 0,
    transition: {
      y: { duration: 0.24, ease: ease.settle, delay: s(i * 40) },
      opacity: { duration: 0.12, delay: 0.3 },
    },
  }),
};

const label: Variants = {
  hidden: { opacity: 0, x: -6 },
  shown: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.28, ease: ease.settle, delay: s(XAI.build + 80 + i * XAI.stagger + XAI.stagger) },
  }),
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export function XaiBreakdown({ contributions, inflated, impact }: Props) {
  const total = contributions.reduce((sum, c) => sum + c.points, 0);
  let offset = 0;
  const placed = contributions.map((c) => {
    const left = offset;
    offset += c.points;
    return { c, left };
  });

  return (
    <motion.div
      className="relative"
      style={{ height: (contributions.length + 1) * ROW }}
      initial="hidden"
      animate="shown"
      exit="exit"
      variants={{ hidden: {}, shown: {}, exit: { transition: { when: 'afterChildren' } } }}
    >
      {/* Ligne 0 : le score entier, puis sa trace une fois éclaté. */}
      <div className="absolute inset-x-0 top-0 flex items-center gap-4 border-b border-line" style={{ height: ROW }}>
        <span className="w-[130px] shrink-0 md:w-[210px] text-[13px]">
          Score <span className="font-medium">{total}</span> <span className="text-muted">=</span>
        </span>
        <span className="relative h-2.5 flex-1">
          <span className="absolute inset-y-0 left-0 rounded-[1px] border border-dashed border-dim" style={{ width: `${total}%` }} />
        </span>
        <span className="w-[92px] shrink-0" />
      </div>

      {placed.map(({ c }, i) => {
        const bad = inflated[c.key] ?? 0;
        return (
          <div
            key={c.key}
            className="absolute inset-x-0 flex items-center gap-4 border-b border-line last:border-b-0"
            style={{ top: (i + 1) * ROW, height: ROW }}
          >
            <motion.span className="w-[130px] shrink-0 md:w-[210px]" variants={label} custom={i}>
              <span className="block truncate text-[13px]">{c.label}</span>
              <span className="block truncate text-[11px] text-muted">{c.evidence}</span>
            </motion.span>
            <span className="relative h-px flex-1 bg-line" />
            <motion.span className="w-[92px] shrink-0 text-right" variants={label} custom={i}>
              <span className="block text-[13px] font-medium">+{c.points}</span>
              {bad > 0 && <span className="block text-[10px] text-alert">dont {bad} suspects</span>}
            </motion.span>
            {impact?.key === c.key && <RowFlash key={impact.id} />}
          </div>
        );
      })}

      {/* Segments : même zone horizontale que les pistes ci-dessus (échelle 0–100 pts). */}
      <div className="pointer-events-none absolute inset-y-0 right-[108px] left-[146px] md:left-[226px]">
        {placed.map(({ c, left }, i) => {
          const bad = inflated[c.key] ?? 0;
          return (
            <motion.span
              key={c.key}
              className="absolute block h-2.5 rounded-[1px] bg-violet-strong"
              style={{ left: `${left}%`, width: `${c.points}%`, top: (ROW - 10) / 2, originX: 0 }}
              variants={segment}
              custom={i}
            >
              {bad > 0 && (
                <span
                  className="absolute inset-y-0 right-0 rounded-[1px] border border-alert bg-panel"
                  style={{ width: `${(bad / c.points) * 100}%` }}
                />
              )}
            </motion.span>
          );
        })}
      </div>
    </motion.div>
  );
}
