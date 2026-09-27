import { motion, useTransform, type MotionValue } from 'framer-motion';
import { useSpringNumber } from '../../motion/useSpringNumber';

const round = (v: number) => String(Math.round(v));

/** Affiche une MotionValue existante (partagée avec le cadran et la maison). */
export function MotionNumber({
  mv,
  format = round,
  className = '',
}: {
  mv: MotionValue<number>;
  format?: (v: number) => string;
  className?: string;
}) {
  const text = useTransform(mv, (v) => format(Math.round(v)));
  return <motion.span className={`tabular-nums ${className}`}>{text}</motion.span>;
}

/** Compteur autonome, animé par spring vers `value`. */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format?: (v: number) => string;
  className?: string;
}) {
  const { mv } = useSpringNumber(value);
  return <MotionNumber mv={mv} format={format} className={className} />;
}
