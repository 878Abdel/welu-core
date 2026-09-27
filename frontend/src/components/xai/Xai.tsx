import { motion } from 'framer-motion';
import { ease } from '../../motion/easings';
import { SHAP_LABELS, type AuditResult } from '../../services/api';

/** Décomposition SHAP renvoyée par /api/audit : une barre par variable, négatif en rouge. */
export function ShapBars({ shap, compact = false }: { shap: AuditResult['xai_shap_breakdown']; compact?: boolean }) {
  const rows = Object.entries(shap).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const max = Math.max(1, ...rows.map(([, v]) => Math.abs(v)));
  return (
    <ul className={compact ? 'space-y-1.5' : 'space-y-2.5'}>
      {rows.map(([k, v], i) => (
        <li key={k} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
          <span className={`${compact ? 'text-[11.5px]' : 'text-[13px]'} text-ink`}>{SHAP_LABELS[k] ?? k.replace(/_/g, ' ')}</span>
          <b className={`${compact ? 'text-[11.5px]' : 'text-[13px]'} tabular-nums ${v < 0 ? 'text-alert' : v === 0 ? 'text-faint' : 'text-violet-deep'}`}>
            {v > 0 ? '+' : ''}
            {v}
          </b>
          <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-line">
            <motion.span
              className={`block h-full origin-left rounded-full ${v < 0 ? 'bg-alert' : 'bg-violet-strong'}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: Math.abs(v) / max }}
              transition={{ duration: 0.5, ease: ease.settle, delay: 0.05 + i * 0.05 }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

const TYPE_STYLE: Record<string, string> = {
  BONUS: 'bg-ok-tint text-ok',
  MALUS: 'bg-alert-tint text-alert',
  NEUTRE: 'bg-surface text-muted',
};

/** Granularité temporelle : chaque événement analysé et son impact. */
export function Timeline({ t }: { t: NonNullable<AuditResult['timeline_granularity']> }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2 text-[12px]">
        <span className="rounded-full bg-ok-tint px-2.5 py-1 font-semibold text-ok">Bonus +{t.total_bonus}</span>
        <span className="rounded-full bg-alert-tint px-2.5 py-1 font-semibold text-alert">Malus −{Math.abs(t.total_malus)}</span>
        <span className="rounded-full bg-surface px-2.5 py-1 font-semibold text-muted">{t.neutral_events_count} neutre(s)</span>
      </div>
      <ul className="divide-y divide-line">
        {t.events_analyzed.map((e, i) => (
          <motion.li
            key={`${e.event}-${i}`}
            className="flex items-center gap-3 py-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: ease.settle, delay: i * 0.05 }}
          >
            <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-bold ${TYPE_STYLE[e.type] ?? TYPE_STYLE.NEUTRE}`}>{e.type}</span>
            <span className="min-w-0 flex-1 text-[12.5px]">{e.description}</span>
            <b className="shrink-0 text-[12.5px] tabular-nums">{e.impact}</b>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return <span className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} aria-hidden />;
}
