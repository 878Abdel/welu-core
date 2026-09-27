import { motion } from 'framer-motion';
import { loanLabel } from '../../data/accounts';
import { number } from '../../lib/format';
import { ease } from '../../motion/easings';
import { SOLVENCY_RULES, zoneOf, type OfferStatus } from '../../services/solvency';

const BAR = { ok: 'bg-ok', warn: 'bg-warn', low: 'bg-alert' };
import type { BankApi, ProspectView } from '../../state/useBank';
import { Sim } from '../client/parts';

export const STATUS_STYLE: Record<OfferStatus, string> = {
  Éligible: 'text-violet-deep',
  'À examiner': 'text-muted',
  'À consolider': 'text-muted',
  'À vérifier': 'text-[#b7791f]',
  Gelé: 'text-alert',
};

const COLS = 'grid-cols-[minmax(150px,1.2fr)_100px_minmax(160px,1.5fr)_128px_112px]';

export function ProspectTable({ api }: { api: BankApi }) {
  const { views, state, select } = api;
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-bg" aria-label="Clients probables">
      <div className={`grid ${COLS} h-[38px] items-center gap-3 border-b border-line bg-surface px-4 text-[11px] font-medium text-muted`}>
        <span>Commerçant</span>
        <span>Score</span>
        <span>Ce qui en fait un bon profil</span>
        <span>Solvabilité</span>
        <span>Prêt recommandé</span>
      </div>
      <ul>
        {views.map((v, i) => (
          <Row key={v.p.id} v={v} i={i} selected={v.p.id === state.selectedId} onSelect={() => select(v.p.id)} />
        ))}
      </ul>
      <div className="flex justify-between gap-4 border-t border-line bg-surface px-4 py-2.5 text-[11px] text-muted">
        <span>
          Solvabilité : marge nette ≥ {SOLVENCY_RULES.veryGoodMargin * 100} % très solvable, ≥ {SOLVENCY_RULES.goodMargin * 100} % solvable · capacité ={' '}
          {SOLVENCY_RULES.capacityShare * 100} % du revenu net · prêt sur {SOLVENCY_RULES.months} mois
        </span>
        <span className="shrink-0">
          Profils fictifs
          <Sim />
        </span>
      </div>
    </section>
  );
}

function Row({ v, i, selected, onSelect }: { v: ProspectView; i: number; selected: boolean; onSelect: () => void }) {
  const { p, score, solv, status, frozen } = v;
  const flagged = status === 'À vérifier';
  return (
    <motion.li
      layout="position"
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect())}
      className={`grid ${COLS} min-h-[60px] cursor-pointer items-center gap-3 border-b border-line px-4 transition-colors last:border-b-0 ${
        selected ? 'bg-tint shadow-[inset_3px_0_0_var(--color-violet-strong)]' : 'hover:bg-surface'
      }`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: ease.settle, delay: i * 0.04 }}
    >
      <div className="min-w-0">
        <b className="block truncate text-[13px] font-semibold">{p.name}</b>
        <span className="text-[11.5px] text-muted">
          {p.trade} · {p.area}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <b className={`w-6 text-[15px] font-semibold ${frozen ? 'text-alert' : ''}`}>{score}</b>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <motion.i
            className={`block h-full rounded-full ${frozen ? 'bg-alert' : BAR[zoneOf(score)]}`}
            style={{ width: `${score}%`, originX: 0 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, ease: ease.settle, delay: 0.1 + i * 0.04 }}
          />
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {frozen ? (
          <Chip tone="alert">Flux circulaires détectés</Chip>
        ) : (
          <>
            {p.request && <Chip tone="request">Demande · {loanLabel(p.request.type)}</Chip>}
            {p.strengths.slice(0, flagged || p.request ? 1 : 2).map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
            {!flagged && !p.request && p.strengths.length > 2 && <Chip tone="neutral">+{p.strengths.length - 2}</Chip>}
            {flagged && <Chip tone="warn">Flux inhabituels</Chip>}
          </>
        )}
      </div>
      <div>
        {frozen ? (
          <>
            <b className="block text-[12.5px] font-semibold text-alert">Non évaluable</b>
            <span className="text-[11px] text-muted">revenus gonflés</span>
          </>
        ) : (
          <>
            <b className={`block text-[12.5px] font-semibold ${solv.label === 'Fragile' ? 'text-muted' : ''}`}>{solv.label}</b>
            <span className="text-[11px] text-muted">marge nette {Math.round(solv.margin * 100)} %</span>
          </>
        )}
      </div>
      <div>
        <b className="block text-[13px] font-semibold">{frozen ? '—' : number(solv.loan)}</b>
        <span className={`text-[11px] font-medium ${STATUS_STYLE[status]}`}>● {v.offerSent ? 'Offre envoyée' : status}</span>
      </div>
    </motion.li>
  );
}

export function Chip({ children, tone = 'violet' }: { children: React.ReactNode; tone?: 'violet' | 'neutral' | 'alert' | 'warn' | 'request' }) {
  const cls = {
    violet: 'bg-tint text-violet-deep',
    neutral: 'border border-line bg-surface text-muted',
    alert: 'bg-alert-tint text-alert',
    warn: 'bg-[#fdf3e1] text-[#b7791f]',
    request: 'bg-violet-strong text-white',
  }[tone];
  return <span className={`inline-flex h-[22px] items-center rounded-full px-2 text-[11px] font-medium whitespace-nowrap ${cls}`}>{children}</span>;
}
