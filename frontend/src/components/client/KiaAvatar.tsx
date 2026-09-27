/** Kia : avatar féminin, foulard violet noué, créoles. */
export function KiaAvatar({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Kia, conseillère financière" className="shrink-0">
      <circle cx="32" cy="32" r="32" fill="var(--color-tint)" />
      {/* Épaules */}
      <path d="M12 64c2-11 10-16 20-16s18 5 20 16z" fill="var(--color-violet-strong)" />
      <path d="M27 44h10v6c-1.5 2-8.5 2-10 0z" fill="#7a4a32" />
      {/* Visage */}
      <ellipse cx="32" cy="33" rx="11.5" ry="13" fill="#8a5538" />
      {/* Foulard (musoor) */}
      <path d="M18 31c-1-11 6-18 14-18s15 7 14 18c-2-6-7-9-14-9s-12 3-14 9z" fill="var(--color-violet)" />
      <path d="M37 13c5-4 12-2 12 4-3-2-7-2-10 0z" fill="var(--color-violet-deep)" />
      <path d="M20 26c3-4 7-6 12-6s9 2 12 6" stroke="var(--color-violet-deep)" strokeWidth="1.2" fill="none" opacity=".5" />
      {/* Yeux, sourire */}
      <circle cx="27.5" cy="33" r="1.4" fill="#2a1a12" />
      <circle cx="36.5" cy="33" r="1.4" fill="#2a1a12" />
      <path d="M28 39c2.2 2 5.8 2 8 0" stroke="#2a1a12" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* Créoles */}
      <circle cx="20.5" cy="38" r="2.4" fill="none" stroke="#e3a008" strokeWidth="1.2" />
      <circle cx="43.5" cy="38" r="2.4" fill="none" stroke="#e3a008" strokeWidth="1.2" />
    </svg>
  );
}
