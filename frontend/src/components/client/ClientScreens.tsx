import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { ease } from '../../motion/easings';
import { scoreOfContributions } from '../../services/solvency';
import type { ClientApi, ClientTab } from '../../state/useClient';
import { HomeScreen } from './HomeScreen';
import { KiaAvatar } from './KiaAvatar';
import { KiaScreen } from './KiaScreen';
import { HistoryScreen, LoanScreen, ProfileScreen } from './OtherScreens';
import { QrIcon, StatusBar } from './parts';
import { QrScreen } from './QrScreen';

const ICONS: Record<'home' | 'history' | 'loan' | 'profile', ReactNode> = {
  home: <path d="M3 9l7-6 7 6v8H3z" fill="currentColor" />,
  history: <path d="M4 5h12M4 10h12M4 15h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
  loan: (
    <>
      <rect x="3" y="5" width="14" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h14" stroke="currentColor" strokeWidth="1.8" />
    </>
  ),
  profile: (
    <>
      <circle cx="10" cy="7" r="3.5" fill="currentColor" />
      <path d="M3 17c1.5-3.5 4-5 7-5s5.5 1.5 7 5" fill="currentColor" />
    </>
  ),
};

const LABELS: Record<ClientTab, string> = { home: 'Accueil', history: 'Historique', qr: 'QR', kia: 'Kia', loan: 'Prêts', profile: 'Profil' };

/**
 * L'app mobile complète. Professionnel : QR au centre de la barre d'onglets.
 * Particulier : pas de QR, Kia prend la place centrale.
 */
export function ClientScreens({ api, preview = false, onLogout }: { api: ClientApi; preview?: boolean; onLogout?: () => void }) {
  const { state, open } = api;
  if (!state.profile) return <div className="flex-1" />;
  const score = scoreOfContributions(state.contributions);
  const pro = state.profile.segment === 'pro';
  const center: ClientTab = pro ? 'qr' : 'kia';
  const tabs: ClientTab[] = ['home', 'history', center, 'loan', 'profile'];
  const mounted: ClientTab[] = pro ? ['home', 'history', 'qr', 'kia', 'loan', 'profile'] : ['home', 'history', 'kia', 'loan', 'profile'];

  const screens: Record<ClientTab, ReactNode> = {
    home: <HomeScreen api={api} score={score} />,
    history: <HistoryScreen api={api} score={score} />,
    qr: pro ? <QrScreen api={api} score={score} /> : null,
    kia: <KiaScreen api={api} score={score} />,
    loan: <LoanScreen api={api} score={score} />,
    profile: <ProfileScreen api={api} onLogout={onLogout} />,
  };

  return (
    <div className={`relative flex min-h-0 flex-1 flex-col ${preview ? 'pointer-events-none select-none' : ''}`} inert={preview}>
      <StatusBar />
      <div className="relative min-h-0 flex-1">
        {mounted.map((id) => {
          const on = state.tab === id;
          return (
            <motion.div
              key={id}
              className={`no-scrollbar absolute inset-0 overflow-y-auto ${on ? '' : 'pointer-events-none'}`}
              initial={false}
              animate={{ opacity: on ? 1 : 0 }}
              transition={{ duration: 0.18, ease: ease.settle }}
              aria-hidden={!on}
              inert={!on}
            >
              {/* L'accueil reste monté (score et maison continus) ; les autres écrans se montent à l'ouverture. */}
              {(on || id === 'home') && screens[id]}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {state.toast && (
          <motion.div
            key={state.toast.id}
            role="status"
            className="absolute inset-x-4 bottom-[96px] z-20 rounded-xl bg-ink px-3.5 py-2.5 text-[12px] font-medium text-white shadow-lg"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.26, ease: ease.settle }}
          >
            {state.toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="absolute inset-x-0 bottom-0 z-10 grid h-[84px] grid-cols-5 items-start border-t border-line bg-bg px-2 pt-2.5" aria-label="Navigation">
        {tabs.map((id) =>
          id === center ? (
            <button key={id} type="button" onClick={() => open(id)} className="-mt-[22px] flex cursor-pointer flex-col items-center gap-[3px]" aria-label={LABELS[id]}>
              <span className="grid size-[52px] place-items-center overflow-hidden rounded-[18px] bg-violet-strong shadow-[0_10px_20px_-8px_rgba(108,92,231,.7)]">
                {id === 'qr' ? <QrIcon /> : <KiaAvatar size={46} />}
              </span>
              <span className={`text-[9.5px] font-medium ${state.tab === id ? 'text-violet-strong' : 'text-faint'}`}>{LABELS[id]}</span>
            </button>
          ) : (
            <button
              key={id}
              type="button"
              onClick={() => open(id)}
              aria-current={state.tab === id ? 'page' : undefined}
              className={`flex cursor-pointer flex-col items-center gap-[3px] text-[9.5px] font-medium ${state.tab === id ? 'text-violet-strong' : 'text-faint'}`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
                {ICONS[id as keyof typeof ICONS]}
              </svg>
              {LABELS[id]}
            </button>
          ),
        )}
      </nav>
    </div>
  );
}
