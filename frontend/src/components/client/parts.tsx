import { motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import type { Transaction } from '../../data/types';
import { clock, number } from '../../lib/format';
import { ease } from '../../motion/easings';

export function StatusBar() {
  const [now, setNow] = useState(clock);
  useEffect(() => {
    const t = window.setInterval(() => setNow(clock()), 10_000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex h-[50px] shrink-0 items-center justify-between px-[30px] pt-[17px] text-[13px] font-semibold max-sm:h-8 max-sm:pt-2">
      <span>{now}</span>
      <span className="flex items-center gap-1.5" aria-hidden>
        <svg width="17" height="11" viewBox="0 0 17 11">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 4.5} y={7 - i * 2.4} width="3" height={4 + i * 2.4} rx="1" fill="currentColor" />
          ))}
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12">
          <rect x=".5" y=".5" width="21" height="11" rx="3" fill="none" stroke="currentColor" opacity=".4" />
          <rect x="2" y="2" width="16" height="8" rx="1.8" fill="currentColor" />
        </svg>
      </span>
    </div>
  );
}

export function ScreenTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between pt-1.5 pb-3">
      <h1 className="text-[19px] font-semibold tracking-[-0.02em]">{title}</h1>
      {right}
    </div>
  );
}

export function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).join('');
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-tint font-semibold text-violet-deep"
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {initials}
    </span>
  );
}

/** Marqueur discret d'une valeur simulée. */
export function Sim({ light = false }: { light?: boolean }) {
  return (
    <span className={`ml-1 text-[9px] font-medium tracking-[0.08em] uppercase ${light ? 'text-white/60' : 'text-faint'}`} title="Valeur simulée">
      sim.
    </span>
  );
}

export function TxRow({ t, index = 0 }: { t: Transaction; index?: number }) {
  const out = t.amount < 0;
  const sub = out ? 'Paiement' : t.channel === 'cash' ? (t.certified ? 'Cash · confirmé par QR' : 'Cash') : 'Mobile money';
  return (
    <motion.li
      layout="position"
      className="grid grid-cols-[34px_1fr_auto] items-center gap-2.5 border-b border-line py-2.5 last:border-b-0"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: ease.settle, delay: index * 0.04 }}
    >
      <span className={`grid size-[34px] place-items-center rounded-[10px] border border-line ${out ? 'bg-surface' : 'bg-tint'}`} aria-hidden>
        <svg width="14" height="14" viewBox="0 0 14 14">
          {out ? (
            <path d="M3 7h8" stroke="var(--color-faint)" strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <path d="M3 7h8M7 3v8" stroke="var(--color-violet-strong)" strokeWidth="1.8" strokeLinecap="round" />
          )}
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12.5px] font-medium">{t.label}</span>
        <span className="text-[10.5px] text-muted">{sub}</span>
      </span>
      <span className={`text-right text-[12.5px] font-semibold ${out ? 'text-muted' : ''}`}>
        {out ? '−' : '+'}
        {number(Math.abs(t.amount))}
        <span className="block text-[10px] font-normal text-muted">{t.time}</span>
      </span>
    </motion.li>
  );
}

export function QrIcon({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth="2" aria-hidden>
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="13" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="13" width="7" height="7" rx="1.5" />
      <path d="M13 13h3v3M20 13v7h-4M13 17v3" />
    </svg>
  );
}
