import { AnimatePresence, motion } from 'framer-motion';
import { AnimatedNumber } from '../components/bank/AnimatedNumber';
import { FlowModal } from '../components/bankweb/FlowModal';
import { ProspectDetail } from '../components/bankweb/ProspectDetail';
import { ProspectTable } from '../components/bankweb/ProspectTable';
import { Sim } from '../components/client/parts';
import { SourceBadge } from '../components/ui/SourceBadge';
import { fcfa } from '../lib/format';
import { ease } from '../motion/easings';
import { useMotionPrefs } from '../motion/MotionPrefs';
import { useBank, type BankApi } from '../state/useBank';

/** Espace banque : l'application web de l'analyste crédit. */
export default function BankConsole({ preview = false }: { preview?: boolean }) {
  const api = useBank();
  const alerts = api.all.filter((v) => v.frozen || v.status === 'À vérifier').length;
  const pro = api.state.segment === 'pro';

  return (
    <div className={`grid min-h-full grid-cols-[224px_1fr] bg-surface max-lg:grid-cols-1 ${preview ? 'pointer-events-none select-none' : ''}`} inert={preview}>
      <Sidebar alerts={alerts} api={api} />
      <main className="min-w-0 px-[26px] pt-[22px] pb-8 max-sm:px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{pro ? 'Professionnels' : 'Particuliers'} · clients de l’app mobile</p>
            <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em]">Clients probables</h1>
            <p className="mt-0.5 text-[13px] text-muted">
              {pro
                ? 'Commerçants, chauffeurs, artisans… dont l’activité justifie une offre de crédit.'
                : 'Particuliers dont l’épargne et la régularité justifient un prêt pour le foyer.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge source={api.state.source} />
            <span className="inline-flex h-9 items-center rounded-[10px] bg-tint px-3 text-[12.5px] font-medium text-violet-deep">Dakar</span>
            <span className="inline-flex h-9 items-center rounded-[10px] border border-line bg-bg px-3 text-[12.5px]">Toutes activités</span>
          </div>
        </div>

        {api.state.error && (
          <p role="alert" className="mt-3 rounded-xl bg-alert-tint px-3 py-2 text-[12px] text-alert">
            Erreur de la source de données : {api.state.error}
          </p>
        )}

        <Kpis api={api} />

        <div className="mt-3.5 grid grid-cols-[minmax(0,1fr)_356px] items-start gap-3.5 max-xl:grid-cols-1">
          <div className="min-w-0 overflow-x-auto">
            <div className="min-w-[680px]">
              <ProspectTable api={api} />
            </div>
          </div>
          <ProspectDetail api={api} />
        </div>
      </main>

      <FlowModal api={api} />
      <AnimatePresence>
        {api.state.toast && (
          <motion.div
            key={api.state.toast.id}
            role="status"
            className="fixed right-6 bottom-6 z-50 rounded-xl bg-ink px-4 py-3 text-[13px] font-medium text-white shadow-lg"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.26, ease: ease.settle }}
          >
            {api.state.toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Kpis({ api }: { api: BankApi }) {
  // Calculés à partir de la liste affichée, jamais saisis à la main.
  const elig = api.views.filter((v) => v.status === 'Éligible');
  const avg = elig.length ? Math.round(elig.reduce((a, v) => a + v.score, 0) / elig.length) : 0;
  const total = elig.reduce((a, v) => a + v.solv.loan, 0);
  const mock = api.state.source === 'mock';
  const cards = [
    { k: 'Prospects analysés', v: api.views.length, f: String, sub: api.state.segment === 'pro' ? 'professionnels à Dakar' : 'particuliers à Dakar' },
    { k: 'Éligibles à une offre', v: elig.length, f: String, sub: 'score ≥ 70, solvable, sans alerte' },
    { k: 'Score moyen des éligibles', v: avg, f: String, sub: 'sur 100' },
  ];
  return (
    <section className="mt-[18px] grid grid-cols-4 gap-3 max-md:grid-cols-2">
      {cards.map((c, i) => (
        <motion.div
          key={c.k}
          className="rounded-2xl border border-line bg-bg px-4 py-3.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: ease.settle, delay: i * 0.06 }}
        >
          <p className="text-[12px] text-muted">{c.k}</p>
          <AnimatedNumber value={c.v} format={c.f} className="mt-1.5 block text-[24px] font-semibold tracking-[-0.02em]" />
          <small className="text-[11.5px] text-muted">{c.sub}</small>
        </motion.div>
      ))}
      <motion.div
        className="rounded-2xl bg-violet-strong px-4 py-3.5 text-white"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: ease.settle, delay: 0.18 }}
      >
        <p className="text-[12px] text-white/75">Montant finançable</p>
        <AnimatedNumber value={total} format={fcfa} className="mt-1.5 block text-[24px] font-semibold tracking-[-0.02em]" />
        <small className="text-[11.5px] text-white/75">
          somme des prêts recommandés
          {mock && <Sim light />}
        </small>
      </motion.div>
    </section>
  );
}

function Sidebar({ alerts, api }: { alerts: number; api: BankApi }) {
  const { reduced, toggle } = useMotionPrefs();
  const item = 'flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-medium';
  return (
    <aside className="sticky top-0 flex h-screen flex-col gap-5 border-r border-line bg-bg px-3.5 py-5 max-lg:hidden">
      <a href="#/" className="flex items-center gap-2.5 px-2">
        <span className="grid size-[30px] place-items-center rounded-[9px] bg-violet-strong font-bold text-white">W</span>
        <span>
          <b className="block text-[15px]">Wëlu</b>
          <span className="text-[11px] text-muted">Console crédit</span>
        </span>
      </a>
      <nav className="flex flex-col gap-0.5" aria-label="Navigation">
        {/* Les deux publics de l'app mobile, séparés */}
        <span className="px-2.5 pb-1.5 text-[10px] font-semibold tracking-[0.12em] text-faint uppercase">Clients de l’app mobile</span>
        {(['pro', 'particulier'] as const).map((sg) => {
          const on = api.state.segment === sg;
          return (
            <button
              key={sg}
              type="button"
              onClick={() => api.setSegment(sg)}
              aria-current={on ? 'page' : undefined}
              className={`${item} cursor-pointer text-left ${on ? 'bg-tint text-violet-deep' : 'text-muted hover:bg-surface'}`}
            >
              <span className="flex-1">{sg === 'pro' ? 'Professionnels' : 'Particuliers'}</span>
              <span className="text-[11px] font-normal text-faint">{api.counts[sg]}</span>
            </button>
          );
        })}
        <span className="mx-2.5 my-2 h-px bg-line" aria-hidden />
        <span className={`${item} text-muted`}>
          Demandes de prêt
          {api.requests > 0 && <span className="ml-auto rounded-full bg-violet-strong px-1.5 text-[10.5px] text-white">{api.requests}</span>}
        </span>
        <span className={`${item} text-muted`}>
          Alertes fraude
          {alerts > 0 && <span className="ml-auto rounded-full bg-alert px-1.5 text-[10.5px] text-white">{alerts}</span>}
        </span>
        <span className="px-2.5 pt-3.5 pb-1.5 text-[10px] font-semibold tracking-[0.12em] text-faint uppercase">Préférences</span>
        <button type="button" onClick={toggle} className={`${item} cursor-pointer text-muted hover:bg-surface`} aria-pressed={reduced}>
          Animations {reduced ? 'réduites' : 'complètes'}
        </button>
      </nav>
      <a href="#/" className="mt-auto flex items-center gap-2.5 rounded-xl border border-line p-2.5 hover:bg-surface">
        <span className="grid size-[30px] place-items-center rounded-full bg-tint text-[11px] font-semibold text-violet-deep">AC</span>
        <span>
          <b className="block text-[12.5px] font-semibold">Analyste crédit</b>
          <span className="text-[11px] text-muted">← Retour à l’accueil</span>
        </span>
      </a>
    </aside>
  );
}
