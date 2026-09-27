import { useState } from 'react';
import { ClientAuth, type ClientSession } from '../components/client/ClientAuth';
import { ClientScreens } from '../components/client/ClientScreens';
import { IPhoneFrame } from '../components/ui/IPhoneFrame';
import { SourceBadge } from '../components/ui/SourceBadge';
import { useClient } from '../state/useClient';
import { source } from '../services/scoringSource';

const KEY = 'welu.session';

const readSession = (): ClientSession | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ClientSession) : null;
  } catch {
    return null;
  }
};

/** Espace client : l'app mobile. Sur ordinateur, elle est présentée dans un iPhone ; sur téléphone, elle prend tout l'écran. */
export default function ClientApp() {
  const [session, setSession] = useState<ClientSession | null>(readSession);

  const login = (s: ClientSession) => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* stockage indisponible : la session reste en mémoire */
    }
    setSession(s);
  };
  const logout = () => {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* rien à nettoyer */
    }
    setSession(null);
  };

  return (
    <div className="flex min-h-full flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-line bg-bg px-7 py-3 max-sm:hidden">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-violet-strong text-[13px] font-bold text-white">W</span>
          <span className="text-[15px] font-bold">Wëlu</span>
          <span className="text-[12.5px] text-muted">App client · mobile</span>
        </div>
        <div className="flex items-center gap-4">
          <SourceBadge source={source.kind} />
          <a href="#/" className="text-[12.5px] text-muted hover:text-violet-strong">
            ← Accueil
          </a>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center py-8 max-sm:p-0">
        <IPhoneFrame>
          {session ? <Session key={session.profileId} profileId={session.profileId} onLogout={logout} /> : <ClientAuth onDone={login} />}
        </IPhoneFrame>
      </main>
    </div>
  );
}

function Session({ profileId, onLogout }: { profileId: string; onLogout: () => void }) {
  const api = useClient(profileId);
  return (
    <>
      {api.state.error && (
        <p role="alert" className="absolute inset-x-3 top-14 z-40 rounded-xl bg-alert-tint px-3 py-2 text-[11.5px] text-alert">
          Erreur de la source de données : {api.state.error}
        </p>
      )}
      <ClientScreens api={api} onLogout={onLogout} />
    </>
  );
}
