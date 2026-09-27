import { motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { MerchantScreens } from '../components/client/MerchantScreens';
import { Avatar, StatusBar } from '../components/client/parts';
import { IPhoneFrame } from '../components/ui/IPhoneFrame';
import { Logo } from '../components/ui/Logo';
import { Spinner } from '../components/xai/Xai';
import { ACTIVITIES, CATALOG, newAccount, type Segment } from '../data/catalog';
import { ease } from '../motion/easings';
import { isFraud, type ApiProfile } from '../services/api';
import { useMerchant } from '../state/useMerchant';
import { useProfiles } from '../state/useProfiles';

const KEY = 'welu.session.v2';
type Stored = { kind: 'demo'; id: string } | { kind: 'new'; profile: ApiProfile };

const read = (): Stored | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
};
const write = (v: Stored | null) => {
  try {
    if (v) sessionStorage.setItem(KEY, JSON.stringify(v));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* stockage indisponible : session en mémoire */
  }
};

const PHONE_H = Math.round(340 * (149.6 / 71.5));

/** Réduit le téléphone pour qu'il tienne en hauteur dans la fenêtre (sur ordinateur). */
function useFitScale() {
  const calc = () => (window.innerWidth < 640 ? 1 : Math.min(0.92, (window.innerHeight - 110) / PHONE_H));
  const [s, setS] = useState(calc);
  useEffect(() => {
    const on = () => setS(calc());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return Math.max(0.55, s);
}

/** App mobile : création de compte (Business / Particulier) ou test avec un profil existant. */
export default function ClientApp() {
  const { profiles, error, loading, reload } = useProfiles();
  const [stored, setStored] = useState<Stored | null>(read);
  const scale = useFitScale();

  const demoProfiles: ApiProfile[] = [...(profiles ?? []).map((p) => ({ ...p, segment: 'pro' as const, source: 'api' as const })), ...CATALOG];
  const profile = stored?.kind === 'new' ? stored.profile : stored ? (demoProfiles.find((p) => p.id === stored.id) ?? null) : null;

  const login = (s: Stored) => {
    write(s);
    setStored(s);
  };
  const logout = () => {
    write(null);
    setStored(null);
  };

  const app = profile ? (
    <Session key={profile.id} profile={profile} onLogout={logout} />
  ) : stored?.kind === 'demo' && loading ? (
    <div className="grid h-full place-items-center bg-bg">
      <Spinner className="size-7 text-violet-strong" />
    </div>
  ) : (
    <Auth demo={{ profiles: demoProfiles, loading, error, reload }} onLogin={login} />
  );

  return (
    <div className="flex min-h-full flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-line bg-bg px-7 py-3 max-sm:hidden">
        <a href="#/" className="flex items-center gap-3">
          <Logo size={26} />
          <span className="text-[12.5px] text-muted">App mobile · client</span>
        </a>
        <a href="#/banque" className="text-[12.5px] text-muted hover:text-violet-strong">
          Console banque →
        </a>
      </header>
      <main className="flex flex-1 items-center justify-center py-6 max-sm:p-0">
        <div className="max-sm:contents" style={{ width: 340 * scale, height: PHONE_H * scale }}>
          <div className="max-sm:contents" style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
            <IPhoneFrame>{app}</IPhoneFrame>
          </div>
        </div>
      </main>
    </div>
  );
}

function Session({ profile, onLogout }: { profile: ApiProfile; onLogout: () => void }) {
  const m = useMerchant(profile);
  return <MerchantScreens m={m} onLogout={onLogout} />;
}

/* ───────────── Connexion / création de compte ───────────── */

type Step = { id: 'welcome' } | { id: 'activity' } | { id: 'form'; segment: Segment; activity?: string } | { id: 'demo' };

function Auth({
  demo,
  onLogin,
}: {
  demo: { profiles: ApiProfile[]; loading: boolean; error: string | null; reload: () => void };
  onLogin: (s: Stored) => void;
}) {
  const [step, setStep] = useState<Step>({ id: 'welcome' });
  const back = (to: Step) => (
    <button type="button" onClick={() => setStep(to)} className="mb-3 cursor-pointer self-start text-[13px] font-medium text-violet-strong">
      ← Retour
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-bg text-ink">
      <StatusBar />
      <motion.div
        key={step.id}
        className="no-scrollbar flex flex-1 flex-col overflow-y-auto px-6 pt-5 pb-8"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: ease.settle }}
      >
        {step.id === 'welcome' && (
          <>
            <Logo size={38} className="self-start" />
            <h1 className="mt-6 text-[23px] leading-tight font-semibold tracking-[-0.02em]">Rendre visible ce que la banque ne voit pas.</h1>
            <p className="mt-2 text-[13px] text-muted">Créez votre compte Wëlu. Vous êtes :</p>
            <div className="mt-5 grid gap-2.5">
              <Choice
                title="Business"
                hint="Commerce, transport, artisanat… Encaissez par QR et prouvez votre activité."
                icon="🏪"
                onClick={() => setStep({ id: 'activity' })}
              />
              <Choice
                title="Particulier"
                hint="Épargne, factures, transferts : construisez votre score pour emprunter."
                icon="🏠"
                onClick={() => setStep({ id: 'form', segment: 'particulier' })}
              />
            </div>
            <button type="button" onClick={() => setStep({ id: 'demo' })} className="mt-auto cursor-pointer pt-6 text-center text-[11.5px] text-faint underline-offset-2 hover:text-muted hover:underline">
              Tester la simulation avec un profil existant
            </button>
          </>
        )}

        {step.id === 'activity' && (
          <>
            {back({ id: 'welcome' })}
            <h1 className="text-[20px] font-semibold tracking-[-0.02em]">Votre activité</h1>
            <p className="mt-1 mb-4 text-[12.5px] text-muted">Touchez la case qui vous correspond.</p>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITIES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setStep({ id: 'form', segment: 'pro', activity: a.label })}
                  className="cursor-pointer rounded-2xl border border-line p-3 text-left hover:border-violet-strong hover:bg-tint"
                >
                  <span className="block text-[13px] font-semibold">{a.label}</span>
                  <span className="block text-[11px] text-muted">{a.hint}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step.id === 'form' && <CreateForm step={step} back={back(step.segment === 'pro' ? { id: 'activity' } : { id: 'welcome' })} onLogin={onLogin} />}

        {step.id === 'demo' && (
          <>
            {back({ id: 'welcome' })}
            <h1 className="text-[20px] font-semibold tracking-[-0.02em]">Mode simulation</h1>
            <p className="mt-1 mb-3 text-[12.5px] text-muted">Connectez-vous avec un profil existant. Le score est calculé en direct par le moteur Wëlu.</p>
            {demo.loading && (
              <p className="mb-2 flex items-center gap-2 text-[12.5px] text-muted">
                <Spinner className="text-violet-strong" /> Profils du serveur…
              </p>
            )}
            {demo.error && (
              <p className="mb-2 rounded-xl bg-alert-tint p-2.5 text-[11.5px] text-alert">
                {demo.error}{' '}
                <button type="button" onClick={demo.reload} className="cursor-pointer font-semibold underline">
                  Réessayer
                </button>
              </p>
            )}
            <Group title="Serveur Wëlu (/api/profiles)">{demo.profiles.filter((p) => p.source === 'api').map((p) => <ProfileBtn key={p.id} p={p} onClick={() => onLogin({ kind: 'demo', id: p.id })} />)}</Group>
            <Group title="Business">{demo.profiles.filter((p) => p.source === 'catalog' && p.segment === 'pro').map((p) => <ProfileBtn key={p.id} p={p} onClick={() => onLogin({ kind: 'demo', id: p.id })} />)}</Group>
            <Group title="Particuliers">{demo.profiles.filter((p) => p.segment === 'particulier').map((p) => <ProfileBtn key={p.id} p={p} onClick={() => onLogin({ kind: 'demo', id: p.id })} />)}</Group>
          </>
        )}
      </motion.div>
    </div>
  );
}

function CreateForm({ step, back, onLogin }: { step: { segment: Segment; activity?: string }; back: ReactNode; onLogin: (s: Stored) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [zone, setZone] = useState('');
  const ok = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 9;
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ok) return;
        const label = `${step.segment === 'pro' ? step.activity : 'Particulier'}${zone.trim() ? ` (${zone.trim()})` : ''}`;
        onLogin({ kind: 'new', profile: newAccount(name.trim(), label, step.segment) });
      }}
    >
      {back}
      <p className="text-[11px] font-semibold tracking-[0.12em] text-violet-strong uppercase">{step.segment === 'pro' ? `Business · ${step.activity}` : 'Particulier'}</p>
      <h1 className="mt-1 text-[20px] font-semibold tracking-[-0.02em]">Créer mon compte</h1>
      <div className="mt-4 grid gap-2.5">
        <Field label="Prénom et nom" value={name} onChange={setName} placeholder="Ex. Aïssatou Ndiaye" />
        <Field label="Téléphone (Wave / Orange Money)" value={phone} onChange={setPhone} placeholder="+221 7X XXX XX XX" type="tel" />
        <Field label={step.segment === 'pro' ? 'Marché ou quartier' : 'Quartier'} value={zone} onChange={setZone} placeholder="Ex. Sandaga" />
      </div>
      <button type="submit" disabled={!ok} className="mt-5 h-12 cursor-pointer rounded-xl bg-violet-strong text-[14px] font-semibold text-white disabled:opacity-50">
        Créer mon compte
      </button>
      <p className="mt-2 text-center text-[10.5px] leading-snug text-muted">Compte de démonstration conservé sur cet appareil uniquement. Votre score part de zéro historique.</p>
    </form>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-medium text-muted">{props.label}</span>
      <input
        type={props.type ?? 'text'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="h-11 w-full rounded-xl border border-line px-3 text-[13.5px] outline-none focus:border-violet-strong"
      />
    </label>
  );
}

function Choice({ title, hint, icon, onClick }: { title: string; hint: string; icon: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line p-3.5 text-left hover:border-violet-strong hover:bg-tint">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-tint text-[20px]" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{title}</span>
        <span className="block text-[11.5px] leading-snug text-muted">{hint}</span>
      </span>
      <span className="text-violet-strong">›</span>
    </button>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <p className="eyebrow mb-1.5">{title}</p>
      <div className="grid gap-1.5">{children}</div>
    </div>
  );
}

function ProfileBtn({ p, onClick }: { p: ApiProfile; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line p-2.5 text-left hover:border-violet-strong hover:bg-tint">
      <Avatar name={p.name} size={32} />
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-semibold">{p.name}</span>
        <span className="block truncate text-[10.5px] text-muted">{p.activity}</span>
      </span>
      {isFraud(p) && <span className="rounded-md bg-alert-tint px-1.5 py-0.5 text-[9.5px] font-bold text-alert">FRAUDE</span>}
    </button>
  );
}
