import { MotionConfig, useReducedMotion } from 'framer-motion';
import { createContext, useContext, useState, type ReactNode } from 'react';

interface MotionPrefs {
  /** Vrai si l'OS le demande ou si l'utilisateur a forcé le mode réduit. */
  reduced: boolean;
  toggle: () => void;
}

const Ctx = createContext<MotionPrefs>({ reduced: false, toggle: () => {} });

function readUrlOverride(): boolean | null {
  const v = new URLSearchParams(window.location.search).get('reduced');
  return v === '1' ? true : v === '0' ? false : null;
}

export function MotionPrefsProvider({ children }: { children: ReactNode }) {
  const os = useReducedMotion() ?? false;
  const [override, setOverride] = useState<boolean | null>(readUrlOverride);
  const reduced = override ?? os;

  return (
    <Ctx.Provider value={{ reduced, toggle: () => setOverride(!reduced) }}>
      {/* En mode réduit, Framer coupe transform/layout ; les séquences sont court-circuitées dans useWelu. */}
      <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>{children}</MotionConfig>
    </Ctx.Provider>
  );
}

export const useMotionPrefs = () => useContext(Ctx);
