import { useEffect, useRef, useState } from 'react';
import { ConsolePane } from '../components/bank/ConsolePane';
import { SplitScreen } from '../components/layout/SplitScreen';
import { MerchantPane } from '../components/merchant/MerchantPane';
import { PulseOverlay } from '../components/propagation/PulseOverlay';
import { ProfileSwitch } from '../components/ui/ProfileSwitch';
import type { ProfileSummary } from '../data/types';
import { useMotionPrefs } from '../motion/MotionPrefs';
import { MOCK_POINTS_PER_CERTIFIED_SALE, source } from '../services/scoringSource';
import { useWelu } from '../state/useWelu';

/** Vue démo côte à côte : le téléphone du commerçant et la console, reliés par l'impulsion. */
export default function DemoSplit() {
  const originRef = useRef<HTMLLIElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const welu = useWelu({ origin: originRef, target: dialRef, divider: dividerRef });
  const { state } = welu;
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const { reduced, toggle } = useMotionPrefs();

  useEffect(() => {
    source.listProfiles().then((list) => {
      setProfiles(list);
      if (list[0]) welu.load(list[0].id);
    });
  }, []);

  // Raccourcis de démo : le rythme des 90 secondes ne dépend pas de la souris.
  const keys = useRef<Record<string, () => void>>({});
  keys.current = {
    ' ': welu.recordSale,
    x: welu.toggleXai,
    f: welu.analyzeFraud,
    r: () => state.profile && welu.load(state.profile.id),
    ...Object.fromEntries(profiles.map((p, i) => [String(i + 1), () => welu.load(p.id)])),
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if ((e.target as HTMLElement).closest('input, textarea')) return;
      const fn = keys.current[e.key.toLowerCase()];
      if (!fn) return;
      e.preventDefault();
      fn();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-2.5">
        <div className="flex items-baseline gap-3">
          <a href="#/" className="text-[15px] font-semibold tracking-[-0.01em]">← Wëlu</a>
          <span className="hidden text-[12px] text-muted sm:inline">Vue démo · les deux côtés en direct</span>
        </div>
        <ProfileSwitch profiles={profiles} activeId={state.profile?.id ?? null} onSelect={welu.load} />
        <button
          type="button"
          onClick={() => state.profile && welu.load(state.profile.id)}
          className="cursor-pointer text-[12px] text-muted transition-colors hover:text-fg"
        >
          Rejouer <span className="text-dim">R</span>
        </button>
      </header>

      {state.error && (
        <p role="alert" className="border-b border-alert px-5 py-2 text-[12px] text-alert">
          Erreur de la source de données : {state.error}
        </p>
      )}

      <SplitScreen
        dividerRef={dividerRef}
        left={<MerchantPane state={state} originRef={originRef} onSale={welu.recordSale} />}
        right={<ConsolePane state={state} dialRef={dialRef} onPanel={welu.setPanel} onToggleXai={welu.toggleXai} />}
      />

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-2 text-[11px] text-muted">
        <span>
          <Key k="Espace" /> vente · <Key k="X" /> expliquer · <Key k="F" /> analyser les flux · <Key k="R" /> rejouer ·{' '}
          <Key k="1" /> <Key k="2" /> profil
        </span>
        {state.source === 'mock' && (
          <span className="text-dim">
            Profils fictifs · recalcul simulé : +{MOCK_POINTS_PER_CERTIFIED_SALE} pts par vente cash confirmée
          </span>
        )}
        <button type="button" onClick={toggle} className="cursor-pointer transition-colors hover:text-fg" aria-pressed={reduced}>
          Mouvement {reduced ? 'réduit' : 'complet'}
        </button>
      </footer>

      <PulseOverlay pulse={state.pulse} onDone={welu.pulseDone} />
    </div>
  );
}

function Key({ k }: { k: string }) {
  return <kbd className="rounded-sm border border-line px-1 font-sans text-[10px] text-fg">{k}</kbd>;
}
