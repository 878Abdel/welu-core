import { motion } from 'framer-motion';
import type { ProfileSummary } from '../../data/types';
import { ease } from '../../motion/easings';

interface Props {
  profiles: ProfileSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function ProfileSwitch({ profiles, activeId, onSelect }: Props) {
  return (
    <div className="flex rounded-md border border-line p-0.5" role="radiogroup" aria-label="Profil">
      {profiles.map((p, i) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(p.id)}
            className={`relative cursor-pointer rounded-[5px] px-3 py-1 text-[12px] transition-colors ${active ? 'text-white' : 'text-muted hover:text-ink'}`}
          >
            {active && (
              <motion.span
                layoutId="profile"
                className="absolute inset-0 rounded-[5px] bg-violet-strong"
                transition={{ duration: 0.26, ease: ease.settle }}
              />
            )}
            <span className="relative">
              <span className="mr-1.5 opacity-50">{i + 1}</span>
              {p.name}
              <span className="ml-1.5 hidden opacity-60 sm:inline">· {p.trade}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
