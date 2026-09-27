import { AnimatePresence, motion } from 'framer-motion';
import { ease } from '../../motion/easings';
import { PULSE } from '../../motion/timeline';
import type { Pulse } from '../../state/useWelu';

interface Props {
  pulse: Pulse | null;
  onDone: () => void;
}

const total = PULSE.impact / 1000;
// Naissance → franchissement de la séparation → impact sur le cadran.
const times = [0, PULSE.spawn / PULSE.impact, PULSE.cross / PULSE.impact, 1];
const segments = [ease.settle, ease.accelerate, ease.decelerate];

/** Calque plein écran : l'impulsion traverse physiquement la séparation gauche/droite. */
export function PulseOverlay({ pulse, onDone }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50" aria-hidden>
      <AnimatePresence>{pulse && <Shot key={pulse.id} pulse={pulse} onDone={onDone} />}</AnimatePresence>
    </div>
  );
}

function Shot({ pulse, onDone }: { pulse: Pulse; onDone: () => void }) {
  const { from, via, to, vertical } = pulse;
  const x = [from.x, from.x, via.x, to.x];
  const y = [from.y, from.y, via.y, to.y];

  return (
    <>
      {/* Traîne : même trajectoire, 40 ms plus tard, plus discrète. */}
      <motion.span
        className="absolute top-0 left-0 -mt-[3px] -ml-[3px] size-[6px] rounded-full bg-violet-strong"
        initial={{ x: from.x, y: from.y, opacity: 0 }}
        animate={{ x, y, opacity: [0, 0.35, 0.35, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: total, times, ease: segments, delay: 0.04 }}
      />
      <motion.span
        className="absolute top-0 left-0 -mt-[5px] -ml-[5px] size-[10px] rounded-full bg-violet-strong"
        style={{ boxShadow: '0 0 14px 4px rgba(108,92,231,0.45)' }}
        initial={{ x: from.x, y: from.y, scale: 0, opacity: 0 }}
        animate={{ x, y, scale: [0, 1, 1, 0.7], opacity: [0, 1, 1, 1] }}
        exit={{ opacity: 0, transition: { duration: 0.1 } }}
        transition={{ duration: total, times, ease: segments }}
        onAnimationComplete={onDone}
      />
      {/* La ligne de séparation s'illumine à l'endroit exact du franchissement. */}
      <motion.span
        className={`absolute top-0 left-0 bg-violet-strong ${vertical ? '-mt-14 h-28 w-px' : '-ml-14 h-px w-28'}`}
        style={{ x: via.x, y: via.y }}
        initial={{ opacity: 0, [vertical ? 'scaleY' : 'scaleX']: 0 }}
        animate={{ opacity: [0, 1, 0], [vertical ? 'scaleY' : 'scaleX']: [0, 1, 1] }}
        transition={{ duration: 0.36, ease: ease.settle, delay: PULSE.cross / 1000 - 0.03 }}
      />
    </>
  );
}
