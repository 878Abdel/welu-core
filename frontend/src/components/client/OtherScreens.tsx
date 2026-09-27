import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { LOAN_TYPES } from '../../data/accounts';
import type { LoanType } from '../../data/types';
import { fcfa } from '../../lib/format';
import { exportStatement } from '../../lib/pdf';
import { ease } from '../../motion/easings';
import { useMotionPrefs } from '../../motion/MotionPrefs';
import { offerFor, SOLVENCY_RULES, zoneOf } from '../../services/solvency';
import type { ClientApi } from '../../state/useClient';
import { KiaAvatar } from './KiaAvatar';
import { Avatar, ScreenTitle, Sim, TxRow } from './parts';

export function HistoryScreen({ api, score }: { api: ClientApi; score: number }) {
  const { state, importStatement } = api;
  const { transactions } = state;
  const fileRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const inflow = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const outflow = transactions.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);

  const onExport = async () => {
    setExporting(true);
    try {
      await exportStatement(state.profile!, transactions, score, state.source);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="px-[18px] pb-28">
      <ScreenTitle title="Historique" />
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-tint p-3">
          <p className="text-[11px] text-muted">Entrées</p>
          <p className="mt-1 text-[16px] font-semibold text-violet-deep">+{fcfa(inflow)}</p>
        </div>
        <div className="rounded-2xl border border-line p-3">
          <p className="text-[11px] text-muted">Sorties</p>
          <p className="mt-1 text-[16px] font-semibold">−{fcfa(outflow)}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-violet-strong text-[12px] font-semibold text-white disabled:opacity-60"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path d="M7 1.5v7M4 6l3 3 3-3M2 11.5h10" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {exporting ? 'Génération…' : 'Exporter en PDF'}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-tint text-[12px] font-semibold text-violet-deep"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path d="M7 9.5v-7M4 5l3-3 3 3M2 11.5h10" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Relevé OM (PDF)
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importStatement(f);
            e.target.value = '';
          }}
        />
      </div>
      {state.statement ? (
        <p className="mt-2 rounded-xl border border-dashed border-violet/60 px-3 py-2 text-[11px] leading-snug text-muted">
          <b className="font-semibold text-ink">{state.statement}</b> reçu. Ses transactions seront lues et ajoutées au score une fois le backend branché.
        </p>
      ) : (
        <p className="mt-2 text-[10.5px] leading-snug text-muted">
          Exportez votre relevé en PDF depuis Orange Money, puis importez-le ici : vos transactions comptent pour votre score.
        </p>
      )}

      <p className="eyebrow mt-4 mb-1">Récentes</p>
      <ul>
        {transactions.map((t, i) => (
          <TxRow key={t.id} t={t} index={i} />
        ))}
      </ul>
    </div>
  );
}

export function LoanScreen({ api, score }: { api: ClientApi; score: number }) {
  const { state, requestLoan, open } = api;
  const { reduced } = useMotionPrefs();
  const p = state.profile!;
  const types = LOAN_TYPES.filter((t) => t.segments.includes(p.segment));
  const [choice, setChoice] = useState<LoanType>(types[0].id);
  const t = types.find((x) => x.id === choice) ?? types[0];
  const o = offerFor(p.finances, t.months);
  const eligible = zoneOf(score) === 'ok' && o.amount > 0;
  const missing = Math.max(0, SOLVENCY_RULES.minScore - score);
  const mock = state.source === 'mock';
  const sent = state.loanRequested;

  return (
    <div className="px-[18px] pb-28">
      <ScreenTitle title="Mon prêt" />
      <p className="eyebrow mb-2">Quel est votre projet ?</p>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Type de prêt">
        {types.map((x) => {
          const on = x.id === choice;
          return (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setChoice(x.id)}
              className={`cursor-pointer rounded-2xl border p-2.5 text-left transition-colors ${on ? 'border-violet-strong bg-tint' : 'border-line bg-bg'}`}
            >
              <span className="block text-[12.5px] font-semibold">{x.label}</span>
              <span className="block text-[10.5px] text-muted">{x.hint}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={`${choice}-${eligible}`}
          className={`mt-3 rounded-[18px] p-4 ${eligible ? 'bg-violet-strong text-white' : 'bg-surface'}`}
          initial={{ opacity: 0, y: reduced ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: ease.settle }}
        >
          {eligible ? (
            <>
              <p className="text-[10.5px] font-semibold tracking-[0.12em] text-white/70 uppercase">{t.label}</p>
              <p className="mt-1.5 text-[26px] font-semibold tracking-[-0.02em]">{fcfa(o.amount)}</p>
              <p className="text-[12px] text-white/80">
                {t.months} mensualités d’environ {fcfa(Math.round(o.monthly / 50) * 50)}
                {mock && <Sim light />}
              </p>
            </>
          ) : (
            <>
              <p className="text-[13px] font-semibold">Pas encore éligible</p>
              <p className="mt-1 text-[12px] leading-snug text-muted">
                Il vous manque <b className="text-ink">{missing} points</b> pour atteindre le seuil de {SOLVENCY_RULES.minScore}. Kia peut vous aider à y arriver.
              </p>
              <button
                type="button"
                onClick={() => open('kia')}
                className="mt-2.5 inline-flex h-8 cursor-pointer items-center gap-2 rounded-full bg-tint pr-3 pl-1 text-[12px] font-semibold text-violet-deep"
              >
                <KiaAvatar size={24} />
                Demander conseil à Kia
              </button>
            </>
          )}
        </motion.section>
      </AnimatePresence>

      <button
        type="button"
        onClick={() => requestLoan(choice)}
        disabled={!eligible || sent === choice}
        className="mt-4 h-11 w-full cursor-pointer rounded-xl bg-violet-strong text-[13px] font-semibold text-white disabled:cursor-default disabled:bg-tint disabled:text-violet-deep"
      >
        {sent === choice ? 'Demande envoyée ✓' : 'Envoyer ma demande à la banque'}
      </button>
      <p className="mt-2 text-center text-[10.5px] leading-snug text-muted">Offre indicative calculée par Wëlu. La décision finale revient à la banque.</p>
    </div>
  );
}

export function ProfileScreen({ api, onLogout }: { api: ClientApi; onLogout?: () => void }) {
  const { state, toggleShare } = api;
  const { reduced, toggle } = useMotionPrefs();
  const p = state.profile!;
  return (
    <div className="px-[18px] pb-28">
      <ScreenTitle title="Profil" />
      <div className="flex items-center gap-3 rounded-2xl border border-line p-3.5">
        <Avatar name={p.name} size={46} />
        <div>
          <p className="text-[14px] font-semibold">{p.name}</p>
          <p className="text-[11.5px] text-muted">
            {p.segment === 'pro' ? 'Professionnel' : 'Particulier'} · {p.trade}
          </p>
          <p className="text-[11px] text-muted">
            {p.location} · n° {p.merchantCode}
          </p>
        </div>
      </div>
      <ul className="mt-4 rounded-2xl border border-line px-3.5">
        <Toggle label="Partager mon score avec les banques partenaires" on={state.shareWithBank} onClick={toggleShare} />
        <Toggle label="Réduire les animations" on={reduced} onClick={toggle} />
      </ul>
      <p className="mt-3 text-[11px] leading-snug text-muted">
        Vos données restent les vôtres : une banque ne voit votre score que si vous l’avez autorisé.
      </p>
      {onLogout && (
        <button type="button" onClick={onLogout} className="mt-4 h-10 w-full cursor-pointer rounded-xl border border-line text-[12.5px] font-semibold text-alert">
          Se déconnecter
        </button>
      )}
    </div>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0">
      <span className="text-[12.5px]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onClick}
        className={`relative h-6 w-10 shrink-0 cursor-pointer rounded-full transition-colors ${on ? 'bg-violet-strong' : 'bg-line'}`}
      >
        <motion.span
          className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow"
          animate={{ x: on ? 16 : 0 }}
          transition={{ duration: 0.2, ease: ease.settle }}
        />
      </button>
    </li>
  );
}
