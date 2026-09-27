import { AnimatePresence, motion } from 'framer-motion';
import { loanLabel } from '../../data/accounts';
import { number } from '../../lib/format';
import { ease } from '../../motion/easings';
import { XAI } from '../../motion/timeline';
import type { BankApi, ProspectView } from '../../state/useBank';
import { Sim } from '../client/parts';
import { Dial } from '../ui/Dial';
import { Chip } from './ProspectTable';

const level = (s: number) => (s >= 85 ? 'Très bon profil' : s >= 70 ? 'Bon profil' : 'À consolider');

export function ProspectDetail({ api }: { api: BankApi }) {
  const v = api.selected;
  if (!v) return <section className="rounded-2xl border border-line bg-bg p-5" />;
  return (
    <section className="sticky top-4 overflow-hidden rounded-2xl border border-line bg-bg" aria-label={`Dossier ${v.p.name}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={v.p.id}
          className="p-[18px]"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: ease.settle }}
        >
          <Body v={v} api={api} />
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function Body({ v, api }: { v: ProspectView; api: BankApi }) {
  const { p, score, solv, frozen, status } = v;
  const initials = p.name.split(' ').map((w) => w[0]).join('');
  const max = Math.max(...p.contributions.map((c) => c.points));
  const capPct = Math.min(100, (solv.capacity / solv.net) * 100);
  const usePct = Math.min(100, (solv.monthly / solv.net) * 100);
  const flagged = status === 'À vérifier';

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-tint font-semibold text-violet-deep">{initials}</span>
        <div className="min-w-0">
          <b className="block text-[15px] font-semibold">{p.name}</b>
          <span className="text-[11.5px] text-muted">
            {p.trade} · {p.area} · {p.dossier}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[112px_1fr] items-center gap-3.5 rounded-2xl bg-surface p-3">
        <Dial value={score} size={112} zones={!frozen} frozen={frozen} taintedPoints={v.inflatedTotal} caption={frozen ? 'gelé' : 'sur 100'} numberClass="text-[30px]" />
        <div>
          {frozen ? <Chip tone="alert">● Alerte fraude</Chip> : <Chip>● {level(score)}</Chip>}
          <p className="mt-1.5 text-[12px] leading-[1.45] text-muted">
            {frozen
              ? `${v.inflatedTotal} points viennent de flux circulaires. Dossier gelé en attente de revue.`
              : `${p.strengths.join(' · ')}.`}
          </p>
        </div>
      </div>

      {p.request && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-violet-strong px-3 py-2.5 text-white">
          <span className="min-w-0">
            <b className="block text-[12.5px] font-semibold">Demande reçue · {loanLabel(p.request.type)}</b>
            <span className="text-[11px] text-white/80">
              {number(p.request.amount)} FCFA sur {p.request.months} mois · envoyée à {p.request.time} depuis l’app
            </span>
          </span>
        </div>
      )}

      <h3 className="mt-[18px] mb-2 flex items-baseline justify-between text-[12.5px] font-semibold">
        Pourquoi ce score
        <span className="text-[11px] font-normal text-faint">contributions en points</span>
      </h3>
      <ul>
        {p.contributions.map((c, i) => {
          const bad = v.inflated[c.key] ?? 0;
          return (
            <li key={c.key} className="grid grid-cols-[1fr_76px_34px] items-center gap-2.5 py-[5px]">
              <div className="min-w-0">
                <b className="block truncate text-[12px] font-medium">{c.label}</b>
                <span className="block truncate text-[10.5px] text-muted">{c.evidence}</span>
              </div>
              <span className="relative h-2 overflow-hidden rounded-full bg-line">
                {/* Barres en stagger de 60 ms : la décomposition se lit dans l'ordre. */}
                <motion.span
                  className="absolute inset-y-0 left-0 flex rounded-full"
                  style={{ width: `${(c.points / max) * 100}%`, originX: 0 }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: XAI.segment / 1000, ease: ease.settle, delay: 0.1 + (i * XAI.stagger) / 1000 }}
                >
                  <span className="h-full bg-violet" style={{ width: `${((c.points - bad) / c.points) * 100}%` }} />
                  {bad > 0 && <span className="h-full flex-1 bg-alert" />}
                </motion.span>
              </span>
              <span className={`text-right text-[12.5px] font-semibold ${bad ? 'text-alert' : 'text-violet-deep'}`}>+{c.points}</span>
            </li>
          );
        })}
      </ul>

      <h3 className="mt-[18px] mb-2 flex items-baseline justify-between text-[12.5px] font-semibold">
        Solvabilité
        <span className="text-[11px] font-normal text-faint">
          par mois · FCFA
          <Sim />
        </span>
      </h3>
      {frozen ? (
        <p className="rounded-xl bg-alert-tint px-3 py-2.5 text-[12px] leading-[1.45] text-alert">
          Les sorties vers les comptes A et B reviennent au commerçant : les revenus ne peuvent pas être évalués tant que le cycle n’est pas expliqué.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-[12.5px]">
            <dt className="text-muted">Revenus estimés</dt>
            <dd className="text-right font-medium">{number(p.finances.revenue)}</dd>
            {p.finances.charges.map((c) => (
              <div key={c.label} className="contents">
                <dt className="text-muted">− {c.label}</dt>
                <dd className="text-right font-medium">{number(c.amount)}</dd>
              </div>
            ))}
            <dt className="border-t border-line pt-1.5 font-semibold">Revenu net</dt>
            <dd className="border-t border-line pt-1.5 text-right font-semibold">{number(solv.net)}</dd>
          </dl>
          <div className="mt-3">
            <div className="relative h-2.5 overflow-hidden rounded-full bg-line">
              <motion.span
                className="absolute inset-y-0 left-0 rounded-full bg-tint-2"
                style={{ width: `${capPct}%`, originX: 0 }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.36, ease: ease.settle, delay: 0.2 }}
              />
              <motion.span
                className="absolute inset-y-0 left-0 rounded-full bg-violet-strong"
                style={{ width: `${usePct}%`, originX: 0 }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.36, ease: ease.settle, delay: 0.3 }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-muted">
              <span>
                <b className="font-semibold text-violet-deep">{number(Math.round(solv.monthly))}</b> mensualité · {Math.round(solv.effort * 100)} % du net
              </span>
              <span>capacité {number(Math.round(solv.capacity))}</span>
            </div>
          </div>
        </>
      )}

      {/* Analyse des flux */}
      {flagged ? (
        <div className="mt-3.5 rounded-xl bg-[#fdf3e1] px-3 py-2.5 text-[12px] leading-[1.45] text-[#8a5a14]">
          <b className="font-semibold">Flux inhabituels signalés.</b> Des montants identiques circulent entre plusieurs comptes. Analysez les flux avant toute offre.
          <button
            type="button"
            onClick={() => api.analyzeFlows(p.id)}
            className="mt-2 flex h-8 w-full cursor-pointer items-center justify-center rounded-[10px] bg-ink text-[12px] font-semibold text-white"
          >
            Analyser les flux
          </button>
        </div>
      ) : frozen ? (
        <button type="button" onClick={() => api.analyzeFlows(p.id)} className="mt-3.5 w-full cursor-pointer rounded-xl bg-alert-tint px-3 py-2.5 text-left text-[12px] text-alert">
          ⚠ Cycle détecté · voir le graphe des flux
        </button>
      ) : (
        <div className="mt-3.5 flex items-start justify-between gap-3 rounded-xl bg-surface px-3 py-2.5 text-[12px] leading-[1.45]">
          <span>
            <span className="text-violet-strong">✓</span> Analyse des flux sur 30 jours : aucun flux circulaire détecté.
          </span>
          {p.profileId && (
            <button type="button" onClick={() => api.analyzeFlows(p.id)} className="shrink-0 cursor-pointer font-medium text-violet-strong">
              Graphe
            </button>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={status !== 'Éligible' || v.offerSent}
          onClick={() => api.sendOffer(p.id)}
          className="h-[38px] flex-1 cursor-pointer rounded-xl bg-violet-strong px-3 text-[13px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-violet-deep disabled:cursor-default disabled:bg-tint disabled:text-violet-deep"
        >
          {v.offerSent
            ? 'Offre envoyée ✓'
            : status === 'Éligible'
              ? `Proposer ${number(solv.loan)} FCFA`
              : status === 'Gelé'
                ? 'Offre suspendue'
                : status === 'À vérifier'
                  ? 'Analyse requise'
                  : 'Revue manuelle'}
        </button>
        <button
          type="button"
          disabled
          title="Disponible avec le backend (génération PDF)"
          className="h-[38px] cursor-not-allowed rounded-xl border border-line px-3 text-[13px] font-semibold text-faint"
        >
          Exporter PDF
        </button>
      </div>
    </>
  );
}
