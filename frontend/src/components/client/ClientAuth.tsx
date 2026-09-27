import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { ACTIVITIES, PARTICULIER_PROFILE, SEGMENTS } from '../../data/accounts';
import type { Activity, Segment } from '../../data/types';
import { ease } from '../../motion/easings';
import { StatusBar } from './parts';

export interface ClientSession {
  segment: Segment;
  activity?: Activity;
  profileId: string;
}

type Step = 'welcome' | 'activity' | 'login';

const ACTIVITY_ICON: Record<Activity, React.ReactNode> = {
  commerce: <path d="M4 9h16l-1.5 11h-13zM8 9V7a4 4 0 0 1 8 0v2" />,
  transport: (
    <>
      <circle cx="6.5" cy="17" r="3" />
      <circle cx="17.5" cy="17" r="3" />
      <path d="M6.5 17l4-8h4l3 8M10 9H8" />
    </>
  ),
  artisanat: <path d="M4 20l9-9M13 11l3-7 4 4-7 3zM4 20l3-1-2-2z" />,
  restauration: <path d="M4 13h16a8 8 0 0 1-16 0zM12 5v4M8 7v2M16 7v2" />,
  agriculture: <path d="M12 21V11M12 11c0-4 3-7 7-7 0 4-3 7-7 7zM12 14c0-3-2.5-5.5-6-5.5 0 3.5 2.5 5.5 6 5.5z" />,
  peche: <path d="M3 12c3-4 8-5 12-3l5-3v12l-5-3c-4 2-9 1-12-3zM15 11.5v.01" />,
};

/** Connexion : Professionnel (activité choisie parmi une liste) ou Particulier. */
export function ClientAuth({ onDone }: { onDone: (s: ClientSession) => void }) {
  const [step, setStep] = useState<Step>('welcome');
  const [segment, setSegment] = useState<Segment>('pro');
  const [activity, setActivity] = useState<Activity | null>(null);
  const act = ACTIVITIES.find((a) => a.id === activity);

  const back = () => setStep(step === 'login' && segment === 'pro' ? 'activity' : 'welcome');

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <StatusBar />
      <div className="flex h-9 items-center px-[18px]">
        {step !== 'welcome' && (
          <button type="button" onClick={back} className="cursor-pointer text-[13px] font-medium text-violet-strong">
            ← Retour
          </button>
        )}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-[18px] pb-10"
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -14 }}
          transition={{ duration: 0.24, ease: ease.settle }}
        >
          {step === 'welcome' && (
            <>
              <span className="grid size-12 place-items-center rounded-2xl bg-violet-strong text-[20px] font-bold text-white">W</span>
              <h1 className="mt-4 text-[24px] leading-tight font-semibold tracking-[-0.02em]">Bienvenue sur Wëlu</h1>
              <p className="mt-1.5 text-[13px] text-muted">Votre activité de tous les jours devient un score de crédit. Qui êtes-vous ?</p>
              <div className="mt-6 flex flex-col gap-2.5">
                {SEGMENTS.map((s, i) => (
                  <motion.button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSegment(s.id);
                      setStep(s.id === 'pro' ? 'activity' : 'login');
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line p-4 text-left transition-colors hover:border-violet-strong hover:bg-tint"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: ease.settle, delay: 0.08 + i * 0.06 }}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-tint text-violet-deep">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        {s.id === 'pro' ? <path d="M4 8h16v11H4zM9 8V5h6v3M4 13h16" /> : <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21c1-4 4-6 7-6s6 2 7 6" />}
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-[14px] font-semibold">{s.label}</b>
                      <span className="text-[11.5px] leading-snug text-muted">{s.hint}</span>
                    </span>
                    <span className="text-violet-strong">→</span>
                  </motion.button>
                ))}
              </div>
            </>
          )}

          {step === 'activity' && (
            <>
              <p className="eyebrow">Professionnel</p>
              <h1 className="mt-1.5 text-[22px] font-semibold tracking-[-0.02em]">Votre activité</h1>
              <p className="mt-1 text-[12.5px] text-muted">Choisissez celle qui vous correspond.</p>
              <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Activité">
                {ACTIVITIES.map((a, i) => (
                  <motion.button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={activity === a.id}
                    onClick={() => {
                      setActivity(a.id);
                      setStep('login');
                    }}
                    className="flex cursor-pointer flex-col items-start gap-2 rounded-2xl border border-line p-3 text-left transition-colors hover:border-violet-strong hover:bg-tint"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.26, ease: ease.settle, delay: 0.05 + i * 0.05 }}
                  >
                    <span className="grid size-9 place-items-center rounded-xl bg-tint text-violet-deep">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        {ACTIVITY_ICON[a.id]}
                      </svg>
                    </span>
                    <span>
                      <b className="block text-[13px] font-semibold">{a.label}</b>
                      <span className="text-[10.5px] text-muted">{a.hint}</span>
                    </span>
                  </motion.button>
                ))}
              </div>
            </>
          )}

          {step === 'login' && (
            <>
              <p className="eyebrow">{segment === 'pro' ? `Professionnel · ${act?.label}` : 'Particulier'}</p>
              <h1 className="mt-1.5 text-[22px] font-semibold tracking-[-0.02em]">Connexion</h1>
              <p className="mt-1 text-[12.5px] text-muted">Avec votre numéro de téléphone, sans compte bancaire.</p>
              <div className="mt-5 rounded-2xl border border-line px-3.5 py-2.5">
                <span className="block text-[10.5px] text-muted">Numéro de téléphone</span>
                <span className="text-[15px] font-medium">+221 77 ••• •• 12</span>
              </div>
              <div className="mt-2 rounded-2xl border border-line px-3.5 py-2.5">
                <span className="block text-[10.5px] text-muted">Code secret</span>
                <span className="mt-1 flex gap-2" aria-label="Code saisi">
                  {[0, 1, 2, 3].map((i) => (
                    <i key={i} className="size-2.5 rounded-full bg-ink" />
                  ))}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onDone({
                    segment,
                    activity: act?.id,
                    profileId: segment === 'pro' ? act!.profileId : PARTICULIER_PROFILE,
                  })
                }
                className="mt-4 h-12 cursor-pointer rounded-2xl bg-violet-strong text-[14px] font-semibold text-white active:scale-[.98]"
              >
                Se connecter
              </button>
              <p className="mt-2.5 text-center text-[10.5px] text-faint">Démo : identifiants pré-remplis, compte fictif.</p>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
