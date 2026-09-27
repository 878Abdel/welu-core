import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Largeur du boîtier en px ; la hauteur suit les proportions de l'iPhone 17 (71,5 × 149,6 mm). */
  width?: number;
  /** Sur petit écran, l'app occupe tout l'écran au lieu d'être dessinée dans un téléphone. */
  frameless?: 'mobile' | 'never';
  className?: string;
}

const RATIO = 149.6 / 71.5;

/** iPhone 17, coloris lavande. */
export function IPhoneFrame({ children, width = 340, frameless = 'mobile', className = '' }: Props) {
  const k = width / 340;
  const bare = frameless === 'mobile';
  return (
    <div
      className={`relative shrink-0 ${bare ? 'max-sm:!h-dvh max-sm:!w-full max-sm:!rounded-none max-sm:!p-0 max-sm:!shadow-none' : ''} ${className}`}
      style={{
        width,
        height: Math.round(width * RATIO),
        borderRadius: 62 * k,
        padding: 3 * k,
        background: 'var(--color-lavender)',
        boxShadow: '0 0 0 1px #cbc1ee, 0 40px 80px -30px rgba(76, 60, 196, .35)',
      }}
    >
      {/* Boutons latéraux : action, volume, alimentation, commande de l'appareil photo */}
      {[
        { l: true, t: 120, h: 28 },
        { l: true, t: 168, h: 52 },
        { l: true, t: 232, h: 52 },
        { l: false, t: 190, h: 80 },
        { l: false, t: 390, h: 44 },
      ].map((b, i) => (
        <i
          key={i}
          className={`absolute w-[3px] rounded-sm bg-[#c6bbeb] ${bare ? 'max-sm:hidden' : ''}`}
          style={{ [b.l ? 'left' : 'right']: -3, top: b.t * k, height: b.h * k }}
          aria-hidden
        />
      ))}
      <div
        className={`h-full bg-[#0d0b14] ${bare ? 'max-sm:!rounded-none max-sm:!p-0' : ''}`}
        style={{ borderRadius: 59 * k, padding: 10 * k }}
      >
        <div
          className={`relative flex h-full flex-col overflow-hidden bg-bg ${bare ? 'max-sm:!rounded-none' : ''}`}
          style={{ borderRadius: 50 * k }}
        >
          <span
            className={`absolute left-1/2 z-30 -translate-x-1/2 rounded-full bg-black ${bare ? 'max-sm:hidden' : ''}`}
            style={{ top: 11 * k, width: 104 * k, height: 30 * k }}
            aria-hidden
          />
          {children}
          <span
            className={`pointer-events-none absolute bottom-2 left-1/2 z-30 h-[5px] -translate-x-1/2 rounded-full bg-ink/85 ${bare ? 'max-sm:hidden' : ''}`}
            style={{ width: 120 * k }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
