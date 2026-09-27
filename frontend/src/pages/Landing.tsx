import { motion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ClientScreens } from '../components/client/ClientScreens';
import { IPhoneFrame } from '../components/ui/IPhoneFrame';
import { go } from '../lib/useHashRoute';
import { ease } from '../motion/easings';
import { useClient } from '../state/useClient';
import BankConsole from './BankConsole';

const BROWSER_W = 520;
const BANK_W = 1440;

/** Accueil en deux moitiés : l'app client (blanc) à gauche, la console banque (violet) à droite. */
export default function Landing() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1') go('client');
      if (e.key === '2') go('banque');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative grid min-h-full grid-cols-2 max-lg:grid-cols-1">
      {/* ── Moitié client : blanc, touches de violet ── */}
      <Half
        side="client"
        className="bg-bg bg-[radial-gradient(700px_420px_at_50%_100%,var(--color-tint)_0%,transparent_70%)] text-ink"
        top={
          <span className="flex items-center gap-2.5 text-[16px] font-bold">
            <span className="grid size-7 place-items-center rounded-lg bg-violet-strong text-[13px] text-white">W</span>
            Wëlu
            <small className="ml-1 text-[12.5px] font-normal text-muted max-sm:hidden">Rendre visible ce que la banque ne voit pas</small>
          </span>
        }
        eyebrow="Espace client · application mobile"
        text="Score, QR, conseils de Kia et prêts, pour les professionnels comme pour les particuliers."
        href="#/client"
        cta="Ouvrir l’app"
        k="1"
        device={<PhonePreview />}
      />

      {/* ── Marqueur de séparation ── */}
      <div
        className="pointer-events-none absolute top-0 bottom-0 left-1/2 z-10 w-px -translate-x-1/2 bg-violet-deep/30 max-lg:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 z-10 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-bg shadow-[0_0_0_6px_rgba(255,255,255,.35),0_12px_30px_-8px_rgba(76,60,196,.5)] max-lg:hidden"
        aria-hidden
      >
        <span className="grid size-11 place-items-center rounded-full bg-violet-strong text-[18px] font-bold text-white">W</span>
      </div>

      {/* ── Moitié banque : violet ── */}
      <Half
        side="bank"
        className="bg-violet-strong bg-[radial-gradient(700px_420px_at_50%_100%,var(--color-violet-deep)_0%,transparent_70%)] text-white"
        top={
          <a href="#/demo" className="ml-auto text-[12px] text-white/75 hover:text-white">
            Vue démo : les deux côtés →
          </a>
        }
        eyebrow="Espace banque · console web"
        text="Clients probables, solvabilité, demandes de prêt et alertes de fraude."
        href="#/banque"
        cta="Ouvrir la console"
        k="2"
        device={<BrowserPreview />}
      />
    </div>
  );
}

function Half(props: {
  side: 'client' | 'bank';
  className: string;
  top: ReactNode;
  eyebrow: string;
  text: string;
  href: string;
  cta: string;
  k: string;
  device: ReactNode;
}) {
  const bank = props.side === 'bank';
  return (
    <section className={`flex min-h-full flex-col px-7 py-4 ${props.className}`}>
      <header className="flex h-8 items-center">{props.top}</header>
      <motion.a
        href={props.href}
        className="group flex flex-1 flex-col items-center justify-center gap-5 py-6 outline-none"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: ease.settle, delay: bank ? 0.14 : 0.06 }}
      >
        <div className="max-w-[380px] text-center">
          <p className={`text-[11px] font-semibold tracking-[0.12em] uppercase ${bank ? 'text-white/75' : 'text-violet-strong'}`}>{props.eyebrow}</p>
          <p className={`mt-2 text-[14px] leading-normal ${bank ? 'text-white/85' : 'text-muted'}`}>{props.text}</p>
        </div>
        <div className="rounded-[26px] transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-1.5 group-focus-visible:outline-2 group-focus-visible:outline-offset-8 group-focus-visible:outline-current motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
          {props.device}
        </div>
        <span
          className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[14px] font-semibold transition-colors ${
            bank ? 'bg-white text-violet-deep group-hover:bg-tint' : 'bg-violet-strong text-white group-hover:bg-violet-deep'
          }`}
        >
          {props.cta}
          <kbd className={`rounded border px-1 font-sans text-[10px] ${bank ? 'border-violet-deep/30' : 'border-white/40'}`}>{props.k}</kbd>
        </span>
      </motion.a>
      <footer className={`text-center text-[11px] ${bank ? 'text-white/60' : 'text-faint'}`}>Démo · profils et données simulés</footer>
    </section>
  );
}

/** Aperçu vivant de l'app client (non interactif). */
function PhonePreview() {
  const api = useClient('awa');
  const W = 232;
  const S = W / 340;
  return (
    <IPhoneFrame width={W} frameless="never">
      {/* L'app est rendue à sa taille réelle puis réduite : l'aperçu est l'app elle-même. */}
      <div className="absolute top-0 left-0 flex flex-col" style={{ width: 314, height: 685, transform: `scale(${S})`, transformOrigin: '0 0' }}>
        <ClientScreens api={api} preview />
      </div>
    </IPhoneFrame>
  );
}

/** Aperçu vivant de la console banque dans une fenêtre de navigateur. */
function BrowserPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(BROWSER_W);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const s = w / BANK_W;
  return (
    <div
      ref={ref}
      className="flex w-[520px] flex-col overflow-hidden rounded-[14px] bg-bg text-ink shadow-[0_40px_80px_-30px_rgba(20,10,60,.6)] max-sm:w-[calc(100vw-56px)]"
      style={{ height: Math.round(w * 0.72) }}
    >
      <div className="flex h-9 shrink-0 items-center gap-3 border-b border-line bg-surface px-3">
        <span className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <i key={i} className="size-2.5 rounded-full bg-tint-2" />
          ))}
        </span>
        <span className="mx-auto grid h-[22px] w-full max-w-[280px] place-items-center rounded-md border border-line bg-bg text-[11px] text-muted">
          Wëlu · Console crédit
        </span>
        <span className="w-[42px]" />
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute top-0 left-0" style={{ width: BANK_W, height: 1000, transform: `scale(${s})`, transformOrigin: '0 0' }}>
          <BankConsole preview />
        </div>
      </div>
    </div>
  );
}
