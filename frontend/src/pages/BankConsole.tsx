import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GpuBar } from '../components/ui/GpuBar';
import { Dial } from '../components/ui/Dial';
import { Logo } from '../components/ui/Logo';
import { ShapBars, Spinner, Timeline } from '../components/xai/Xai';
import { CATALOG } from '../data/catalog';
import { fcfa } from '../lib/format';
import { errText, useToast } from '../lib/toast';
import { ease } from '../motion/easings';
import { api, auditPayloadFor, isFraud, tierLabel, type ApiProfile, type AuditResult } from '../services/api';
import { useProfiles } from '../state/useProfiles';

type Filter = 'pro' | 'particulier' | 'alertes';
interface Row {
  p: ApiProfile;
  audit: AuditResult | null;
  loading: boolean;
  error: string | null;
}

const segOf = (p: ApiProfile) => p.segment ?? 'pro';

/** Console banque : clients proposés, audités en temps réel sur GPU par /api/audit. */
export default function BankConsole({ preview = false }: { preview?: boolean }) {
  const pushToast = useToast();
  const toast = useCallback((t: string, tone?: 'ok' | 'error' | 'info') => !preview && pushToast(t, tone), [preview, pushToast]);
  const { profiles: apiProfiles, error: listError, loading: listLoading, reload } = useProfiles();
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [filter, setFilter] = useState<Filter>('pro');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const all = useMemo(() => [...(apiProfiles ?? []).map((p) => ({ ...p, segment: 'pro' as const, source: 'api' as const })), ...CATALOG], [apiProfiles]);

  const runAudit = useCallback(
    async (p: ApiProfile, notify = false) => {
      setRows((r) => ({ ...r, [p.id]: { p, audit: r[p.id]?.audit ?? null, loading: true, error: null } }));
      try {
        const audit = await api.audit(auditPayloadFor(p));
        setRows((r) => ({ ...r, [p.id]: { p, audit, loading: false, error: null } }));
        if (notify) {
          if (isFraud(audit)) toast(audit.alert ?? 'Risque critique détecté', 'error');
          else toast(`Audit ${p.name} : ${audit.welu_score}/100 en ${audit.latency_ms.toFixed(2)} ms`, 'ok');
        }
      } catch (e) {
        setRows((r) => ({ ...r, [p.id]: { p, audit: null, loading: false, error: errText(e) } }));
        if (notify) toast(errText(e), 'error');
      }
    },
    [toast],
  );

  // Chaque profil proposé est audité par le moteur dès l'ouverture.
  useEffect(() => {
    if (!apiProfiles) return;
    all.forEach((p) => runAudit(p));
    setSelectedId((s) => s ?? all[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiProfiles]);

  const list = all.map((p) => rows[p.id] ?? { p, audit: null, loading: true, error: null });
  const alerts = list.filter((r) => isFraud(r.audit));
  const visible = (filter === 'alertes' ? alerts : list.filter((r) => segOf(r.p) === filter)).sort((a, b) => (b.audit?.welu_score ?? -1) - (a.audit?.welu_score ?? -1));
  const counts = { pro: list.filter((r) => segOf(r.p) === 'pro').length, particulier: list.filter((r) => segOf(r.p) === 'particulier').length, alertes: alerts.length };
  const selected = list.find((r) => r.p.id === selectedId) ?? null;
  const fraud = isFraud(selected?.audit);
  // Dans l'aperçu de l'accueil, la console est déjà dans un lien : pas de lien imbriqué.
  const A = preview ? 'span' : 'a';

  const done = visible.filter((r) => r.audit);
  const lastLatency = selected?.audit?.latency_ms ?? done[0]?.audit?.latency_ms ?? null;
  const kpis = [
    ['Profils audités', `${done.length} / ${visible.length}`],
    ['Solvables (≥ 70)', String(done.filter((r) => !isFraud(r.audit) && r.audit!.welu_score >= 70).length)],
    ['Score moyen', done.length ? String(Math.round(done.reduce((s, r) => s + r.audit!.welu_score, 0) / done.length)) : '—'],
    ['Latence moyenne', done.length ? `${(done.reduce((s, r) => s + r.audit!.latency_ms, 0) / done.length).toFixed(2)} ms` : '—'],
  ];

  const NAV: { id: Filter; label: string }[] = [
    { id: 'pro', label: 'Professionnels' },
    { id: 'particulier', label: 'Particuliers' },
    { id: 'alertes', label: 'Alertes fraude' },
  ];

  return (
    <div className={`flex min-h-full flex-col transition-colors duration-300 ${fraud ? 'bg-[#fff0f0]' : 'bg-surface'}`}>
      <GpuBar latency={lastLatency} danger={fraud} />

      <div className="grid flex-1 grid-cols-[230px_1fr] max-lg:grid-cols-1">
        {/* ── Barre latérale ── */}
        <aside className={`flex flex-col border-r px-4 py-5 transition-colors ${fraud ? 'border-alert/30 bg-alert text-white' : 'border-line bg-bg'}`}>
          <A {...(preview ? {} : { href: '#/' })} className="mb-6 px-2" aria-label="Accueil Wëlu">
            <Logo light={fraud} size={30} />
          </A>
          <p className={`mb-2 px-2 text-[11px] font-semibold tracking-[0.12em] uppercase ${fraud ? 'text-white/70' : 'text-faint'}`}>Clients de l’app mobile</p>
          <nav className="space-y-1">
            {NAV.map((n) => {
              const on = filter === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setFilter(n.id)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                    on ? (fraud ? 'bg-white text-alert' : 'bg-tint text-violet-deep') : fraud ? 'hover:bg-white/15' : 'text-muted hover:bg-surface'
                  }`}
                >
                  {n.label}
                  <span
                    className={`min-w-6 rounded-full px-1.5 text-center text-[11px] font-bold ${
                      n.id === 'alertes' && counts.alertes ? 'bg-alert text-white' : on ? 'bg-white' : fraud ? 'bg-white/20' : 'bg-surface'
                    }`}
                  >
                    {counts[n.id]}
                  </span>
                </button>
              );
            })}
          </nav>
          {listError && (
            <div className="mt-4 rounded-xl bg-alert-tint p-3 text-[12px] text-alert">
              {listError}
              <button type="button" onClick={reload} className="mt-2 block cursor-pointer font-semibold underline">
                Réessayer
              </button>
            </div>
          )}
          <p className={`mt-6 px-2 text-[11px] leading-snug ${fraud ? 'text-white/70' : 'text-faint'}`}>
            Profils de /api/profiles et profils de démonstration. Les scores sont tous calculés par /api/audit.
          </p>
          <A {...(preview ? {} : { href: '#/client' })} className={`mt-auto px-2 pt-6 text-[12.5px] font-medium ${fraud ? 'text-white/80 hover:text-white' : 'text-muted hover:text-violet-strong'}`}>
            Ouvrir l’app client →
          </A>
        </aside>

        <main className="min-w-0 px-7 py-6 max-sm:px-4">
          <header className="mb-4">
            <p className={`text-[11px] font-semibold tracking-[0.12em] uppercase ${fraud ? 'text-alert' : 'text-violet-strong'}`}>Console crédit</p>
            <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.02em]">
              {filter === 'pro' ? 'Professionnels proposés' : filter === 'particulier' ? 'Particuliers proposés' : 'Alertes fraude'}
            </h1>
          </header>

          <div className="mb-4 grid grid-cols-4 gap-3 max-md:grid-cols-2">
            {kpis.map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-line bg-bg px-4 py-3">
                <p className="text-[11.5px] text-muted">{k}</p>
                <p className="mt-0.5 text-[20px] font-semibold tabular-nums">{v}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-5 max-xl:grid-cols-1">
            {/* Tableau */}
            <section className="overflow-hidden rounded-2xl border border-line bg-bg">
              {listLoading && (
                <p className="flex items-center gap-2 p-4 text-[13px] text-muted">
                  <Spinner className="text-violet-strong" /> Chargement des profils…
                </p>
              )}
              {!listLoading && !visible.length && <p className="p-4 text-[13px] text-muted">Aucun profil dans cette catégorie.</p>}
              <ul className="divide-y divide-line">
                {visible.map((r, i) => (
                  <ProspectRow key={r.p.id} r={r} i={i} on={r.p.id === selectedId} onClick={() => setSelectedId(r.p.id)} />
                ))}
              </ul>
            </section>

            {/* Dossier */}
            {selected && <Detail r={selected} onAudit={() => runAudit(selected.p, true)} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function ProspectRow({ r, i, on, onClick }: { r: Row; i: number; on: boolean; onClick: () => void }) {
  const a = r.audit;
  const bad = isFraud(a);
  const score = a?.welu_score ?? 0;
  const tone = bad ? 'bg-alert' : score >= 70 ? 'bg-ok' : score >= 50 ? 'bg-warn' : 'bg-alert';
  const m = r.p.metrics;
  return (
    <motion.li initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: ease.settle, delay: i * 0.03 }}>
      <button
        type="button"
        onClick={onClick}
        className={`grid w-full cursor-pointer grid-cols-[1fr_120px] items-center gap-4 px-4 py-3 text-left transition-colors ${on ? (bad ? 'bg-alert-tint' : 'bg-tint') : 'hover:bg-surface'}`}
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-[13.5px] font-semibold">{r.p.name}</span>
            {r.p.source === 'api' && <span className="rounded bg-ink px-1 text-[9px] font-bold text-white">API</span>}
            {bad && <span className="rounded bg-alert px-1.5 text-[10px] font-bold text-white">FRAUDE</span>}
          </span>
          <span className="block truncate text-[11.5px] text-muted">{r.p.activity}</span>
          <span className="mt-1 flex flex-wrap gap-x-3 text-[10.5px] text-faint">
            <span>Wave/OM {fcfa(m.wave_om_volume_monthly)}</span>
            <span>Woyofal {m.woyofal_streak_months} mois</span>
            <span>SIM {m.sim_age_years} ans</span>
            <span>Ancrage {Math.round(m.market_geo_anchor_rate * 100)} %</span>
          </span>
        </span>
        <span>
          {a ? (
            <>
              <span className="flex items-baseline justify-between">
                <b className={`text-[18px] tabular-nums ${bad ? 'text-alert' : ''}`}>{score}</b>
                <span className="text-[10px] text-muted">{a.latency_ms.toFixed(2)} ms</span>
              </span>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-line">
                <motion.span className={`block h-full origin-left ${tone}`} initial={{ scaleX: 0 }} animate={{ scaleX: score / 100 }} transition={{ duration: 0.5, ease: ease.settle }} />
              </span>
              <span className="mt-1 block truncate text-[10.5px] text-muted">{tierLabel(a.risk_rating)}</span>
            </>
          ) : r.error ? (
            <span className="text-[11px] text-alert">Erreur audit</span>
          ) : (
            <Spinner className="text-violet-strong" />
          )}
        </span>
      </button>
    </motion.li>
  );
}

function Detail({ r, onAudit }: { r: Row; onAudit: () => void }) {
  const { p, audit } = r;
  const fraud = isFraud(audit);
  const m = p.metrics;
  return (
    <div className="grid content-start gap-4">
      <section className={`rounded-2xl border bg-bg p-5 ${fraud ? 'border-alert' : 'border-line'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-muted">
              Dossier {p.id} · {p.segment === 'particulier' ? 'Particulier' : 'Professionnel'}
            </p>
            <h2 className="text-[20px] font-semibold tracking-[-0.02em]">{p.name}</h2>
            <p className="text-[12.5px] text-muted">{p.activity}</p>
          </div>
          <button
            type="button"
            onClick={onAudit}
            disabled={r.loading}
            className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-60 ${
              fraud ? 'bg-alert' : 'bg-violet-strong hover:bg-violet-deep'
            }`}
          >
            {r.loading && <Spinner />}
            {r.loading ? 'Audit GPU…' : 'Relancer l’audit IA'}
          </button>
        </div>

        <AnimatePresence>
          {fraud && audit && (
            <motion.div
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-xl bg-alert p-3.5 text-white"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: ease.settle }}
            >
              <motion.span
                className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-[16px] font-black text-alert"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                !
              </motion.span>
              <div>
                <p className="text-[14px] font-bold">{audit.decision}</p>
                <p className="text-[12.5px] text-white/90">{audit.alert ?? 'Anomalie détectée par le bouclier anti-fraude.'}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {r.error && !audit && <p className="mt-4 rounded-xl bg-alert-tint p-3 text-[12.5px] text-alert">Audit impossible : {r.error}</p>}

        {audit ? (
          <div className="mt-4 grid grid-cols-[170px_1fr] items-center gap-5 max-sm:grid-cols-1">
            <Dial key={p.id} value={audit.welu_score} size={170} fromZero zones caption="sur 100" numberClass="text-[44px]" />
            <div className="min-w-0">
              <p
                className={`rounded-xl px-3 py-2 text-[13px] font-bold ${
                  fraud ? 'bg-alert text-white' : audit.welu_score >= 70 ? 'bg-ok-tint text-ok' : 'bg-warn-tint text-[#9a6b00]'
                }`}
              >
                {audit.decision}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                <Stat k="Notation" v={tierLabel(audit.risk_rating)} />
                <Stat k="Latence" v={`${audit.latency_ms.toFixed(2)} ms`} />
                <Stat k="Matériel" v={audit.hardware_used} wide />
              </dl>
            </div>
          </div>
        ) : (
          !r.error && (
            <div className="grid h-[170px] place-items-center">
              <Spinner className="size-8 text-violet-strong" />
            </div>
          )
        )}
      </section>

      {audit && (
        <section className={`rounded-2xl border bg-bg p-5 ${fraud ? 'border-alert' : 'border-line'}`}>
          <p className="eyebrow mb-3">Pourquoi ce score · décomposition SHAP</p>
          <ShapBars shap={audit.xai_shap_breakdown} />
        </section>
      )}

      {audit?.timeline_granularity && (
        <section className="rounded-2xl border border-line bg-bg p-5">
          <p className="eyebrow mb-3">Événements récents analysés</p>
          <Timeline t={audit.timeline_granularity} />
        </section>
      )}

      <section className={`rounded-2xl border bg-bg p-5 ${fraud ? 'border-alert' : 'border-line'}`}>
        <p className="eyebrow mb-3">Signaux transmis au moteur</p>
        <dl className="grid grid-cols-3 gap-2 text-[12px] max-sm:grid-cols-2">
          <Stat k="Volume Wave / OM" v={`${fcfa(m.wave_om_volume_monthly)} / mois`} />
          <Stat k="Woyofal à l’heure" v={`${m.woyofal_streak_months} mois`} />
          <Stat k="Ancienneté SIM" v={`${m.sim_age_years} ans`} />
          <Stat k="Ancrage marché" v={`${Math.round(m.market_geo_anchor_rate * 100)} %`} />
          <Stat k="Cash certifié QR" v={fcfa(m.cash_qr_volume)} />
          <Stat k="Clients uniques" v={String(auditPayloadFor(p).unique_clients_count)} />
        </dl>
      </section>
    </div>
  );
}

function Stat({ k, v, wide = false }: { k: string; v: string; wide?: boolean }) {
  return (
    <div className={`rounded-xl bg-surface px-3 py-2 ${wide ? 'col-span-2' : ''}`}>
      <dt className="text-[11px] text-muted">{k}</dt>
      <dd className="mt-0.5 font-semibold break-words">{v}</dd>
    </div>
  );
}
