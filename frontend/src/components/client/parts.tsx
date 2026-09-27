import { useEffect, useState, type ReactNode } from 'react';
import { clock } from '../../lib/format';

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
