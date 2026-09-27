import { AnimatePresence, motion } from 'framer-motion';
import type { Ref } from 'react';
import type { ContributionKey } from '../../data/types';
import { ease } from '../../motion/easings';
import { useSpringNumber } from '../../motion/useSpringNumber';
import { scoreOf, type Panel, type WeluState } from '../../state/useWelu';
import { FraudGraph } from '../fraud/FraudGraph';
import { BrickHouse } from '../house/BrickHouse';
import { SourceBadge } from '../ui/SourceBadge';
import { ActivityLog } from './ActivityLog';
import { DataIntake } from './DataIntake';
import { MerchantSilhouette } from './MerchantSilhouette';
import { ScoreDial } from './ScoreDial';
import { StatusLabel } from './StatusLabel';
import { XaiBreakdown } from './XaiBreakdown';

interface Props {
  state: WeluState;
  dialRef: Ref<HTMLDivElement>;
  onPanel: (p: Panel) => void;
  onToggleXai: () => void;
}

const TABS: { id: Panel; label: string; key: string }[] = [
  { id: 'sources', label: 'Sources', key: '' },
  { id: 'xai', label: 'Explication', key: 'X' },
  { id: 'fraud', label: 'Flux', key: 'F' },
];

export function ConsolePane({ state, dialRef, onPanel, onToggleXai }: Props) {
  const { profile, contributions, revealed, phase, frozen, fraud, fraudStage, panel, impact } = state;
  const score = scoreOf(contributions, revealed);
  const { mv, current } = useSpringNumber(score, state.runId);
  const ready = phase === 'bankable';
  const mock = state.source === 'mock';

  const inflated: Partial<Record<ContributionKey, number>> = {};
  if (frozen && fraud) for (const i of fraud.inflated) inflated[i.key] = i.points;
  const taintedPoints = Object.values(inflated).reduce((a, b) => a + (b ?? 0), 0);

  const status = frozen ? 'frozen' : !ready ? 'invisible' : score >= 60 ? 'bankable' : 'consolidate';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
        <div className="flex items-baseline gap-3">
          <span className="eyebrow">Vue analyste · banque</span>
          {profile && <span className="text-[11px] text-dim">Dossier {profile.dossier}</span>}
        </div>
        <SourceBadge source={state.source} />
      </header>

      {/* Ligne héros : le commerçant, son score, sa maison. */}
      <div className="grid grid-cols-1 items-stretch border-b border-line md:grid-cols-[minmax(0,1.3fr)_auto_minmax(0,1fr)]">
        <div className="flex min-w-0 items-center gap-4 px-5 py-4">
          <div className="h-[128px] shrink-0">
            <MerchantSilhouette revealed={revealed} solid={ready} frozen={frozen} />
          </div>
          <div className="min-w-0">
            <p className="eyebrow">Commerçant</p>
            <p className="mt-1 truncate text-[17px] font-medium tracking-[-0.01em]">{profile?.name ?? '—'}</p>
            <p className="truncate text-[12px] text-muted">{profile?.trade}</p>
            <p className="truncate text-[12px] text-muted">{profile?.location}</p>
            <p className="mb-3 text-[12px] text-muted">{profile ? `Actif depuis ${profile.activeSince}` : ''}</p>
            <StatusLabel status={status} />
          </div>
        </div>
        <div className="flex items-center justify-center border-y border-line px-6 py-4 md:border-x md:border-y-0 md:py-0">
          <ScoreDial
            ref={dialRef}
            mv={mv}
            current={current}
            score={score}
            taintedPoints={taintedPoints}
            frozen={frozen}
            impactId={impact?.id ?? null}
            expanded={panel === 'xai'}
            disabled={!ready}
            onToggle={onToggleXai}
          />
        </div>
        <BrickHouse score={score} taintedPoints={taintedPoints} resetKey={state.runId} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_280px]">
        <section className="flex min-h-0 flex-col border-b border-line md:border-r md:border-b-0">
          <nav className="flex gap-5 px-5 pt-4 pb-3" aria-label="Panneau">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={!ready}
                onClick={() => onPanel(t.id)}
                className={`eyebrow relative cursor-pointer transition-colors disabled:cursor-default ${panel === t.id ? 'text-fg!' : 'hover:text-fg!'}`}
              >
                {t.label}
                {t.key && <span className="ml-1.5 text-dim">{t.key}</span>}
                {panel === t.id && (
                  <motion.span layoutId="tab" className="absolute -bottom-1 left-0 h-px w-full bg-fg" transition={{ duration: 0.24, ease: ease.settle }} />
                )}
              </button>
            ))}
          </nav>
          <div className="relative min-h-0 flex-1 overflow-hidden px-5 pb-4">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={panel}
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                // La décomposition se referme d'abord (implosion), puis le panneau s'efface.
                exit={{ opacity: 0, transition: { duration: 0.16, delay: panel === 'xai' ? 0.3 : 0 } }}
                transition={{ duration: 0.16 }}
              >
                {panel === 'sources' && <DataIntake contributions={contributions} revealed={revealed} mock={mock} impact={impact} />}
                {panel === 'xai' && <XaiBreakdown contributions={contributions} inflated={inflated} impact={impact} />}
                {panel === 'fraud' && profile && fraud && <FraudGraph graph={profile.flows} analysis={fraud} stage={fraudStage} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
        <ActivityLog entries={state.log} />
      </div>
    </div>
  );
}
