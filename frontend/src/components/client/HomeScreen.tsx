import { motion } from 'framer-motion';
import { fcfa } from '../../lib/format';
import { ease } from '../../motion/easings';
import { kiaSays } from '../../services/kia';
import { solvency, SOLVENCY_RULES, zoneOf } from '../../services/solvency';
import type { ClientApi } from '../../state/useClient';
import { tierOf } from '../house/houseLayout';
import { HouseSvg } from '../house/BrickHouse';
import { Dial } from '../ui/Dial';
import { KiaAvatar } from './KiaAvatar';
import { Avatar, QrIcon, Sim, TxRow } from './parts';

const ZONE = {
  ok: { chip: 'bg-ok-tint text-ok', label: () => 'Éligible au prêt' },
  warn: { chip: 'bg-warn-tint text-[#9a6b00]', label: (m: number) => `Presque : encore ${m} points` },
  low: { chip: 'bg-alert-tint text-alert', label: (m: number) => `Encore un effort : ${m} points` },
};

// Les cartes arrivent en série, jamais en bloc.
const item = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: ease.settle, delay: 0.08 + i * 0.06 },
});

export function HomeScreen({ api, score }: { api: ClientApi; score: number }) {
  const { state, open } = api;
  const p = state.profile!;
  const offer = solvency(p.finances);
  const gain = score - state.openingScore;
  const tier = tierOf(score);
  const zone = zoneOf(score);
  const missing = Math.max(0, SOLVENCY_RULES.minScore - score);
  const pro = p.segment === 'pro';
  const tip = p.advice?.text ?? kiaSays('score', p, score, state.transactions).fr;
  const mock = state.source === 'mock';

  return (
    <div className="px-[18px] pb-28">
      <motion.div className="flex items-center justify-between pt-2 pb-3.5" {...item(0)}>
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]">Bonjour {p.name.split(' ')[0]}</h1>
          <p className="mt-0.5 text-[12px] text-muted">
            {p.trade} · {p.area}
          </p>
        </div>
        <button type="button" onClick={() => open('profile')} aria-label="Profil" className="cursor-pointer">
          <Avatar name={p.name} />
        </button>
      </motion.div>

      {/* Score de crédibilité + maison */}
      <motion.section className="overflow-hidden rounded-2xl border border-line" {...item(1)}>
        <div className="grid grid-cols-[104px_1fr] items-center gap-3 p-3.5">
          <Dial value={score} size={104} fromZero zones caption="sur 100" numberClass="text-[30px]" />
          <div>
            <h2 className="text-[13px] font-semibold">Score de crédibilité</h2>
            <span className={`mt-1.5 inline-flex h-[22px] items-center rounded-full px-2 text-[11px] font-semibold ${ZONE[zone].chip}`}>
              ● {ZONE[zone].label(missing)}
            </span>
            <p className="mt-2 text-[11px] text-muted">
              {gain > 0 ? (
                <>
                  <span className="font-medium text-violet-strong">▲ +{gain}</span> depuis l’ouverture
                </>
              ) : (
                'Mis à jour en direct'
              )}
              {mock && <Sim />}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_118px] items-end gap-2.5 border-t border-line px-3.5 pt-2.5 pb-3">
          <p className="text-[11.5px] leading-[1.45] text-muted">
            <b className="font-semibold text-ink">{tier ? `Ma maison · ${tier.label.toLowerCase()}` : 'Ma maison est terminée'}</b>
            <br />
            {score < 100 ? `Encore ${100 - score} points pour la terminer.` : 'Bravo, tous les paliers sont atteints.'}
          </p>
          <HouseSvg score={score} className="w-[118px]" />
        </div>
      </motion.section>

      {/* Prêt disponible : même calcul que la console banque */}
      <motion.section className="mt-3 rounded-[18px] bg-violet-strong p-3.5 text-white" {...item(2)}>
        <p className="text-[10.5px] font-semibold tracking-[0.12em] text-white/70 uppercase">{zone === 'ok' ? 'Prêt disponible' : 'Mon prochain prêt'}</p>
        {zone === 'ok' ? (
          <>
            <p className="mt-1.5 text-[24px] font-semibold tracking-[-0.02em]">{fcfa(offer.loan)}</p>
            <p className="text-[11.5px] text-white/80">
              Sur {SOLVENCY_RULES.months} mois · ≈ {fcfa(Math.round(offer.monthly / 50) * 50)} / mois
              {mock && <Sim light />}
            </p>
          </>
        ) : (
          <>
            <p className="mt-1.5 text-[20px] font-semibold tracking-[-0.02em]">Encore {missing} points</p>
            <p className="text-[11.5px] text-white/80">pour atteindre le seuil de {SOLVENCY_RULES.minScore} et débloquer un prêt.</p>
          </>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[11px] text-white/80">{state.loanRequested ? 'Demande envoyée' : zone === 'ok' ? 'Proposé par une banque partenaire' : 'Kia vous guide'}</span>
          <button
            type="button"
            onClick={() => open('loan')}
            className="h-8 cursor-pointer rounded-[10px] bg-white px-3.5 text-[12px] font-semibold whitespace-nowrap text-violet-deep active:scale-[.97]"
          >
            {zone === 'ok' ? 'Voir l’offre' : 'Mes prêts'}
          </button>
        </div>
      </motion.section>

      {/* Kia, conseillère financière */}
      <motion.section className="mt-3 rounded-2xl bg-tint p-3.5" {...item(3)}>
        <div className="flex items-center gap-2.5">
          <KiaAvatar size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-violet-deep">Kia · conseillère financière</p>
            <p className="text-[10.5px] text-muted">En français ou en wolof, à l’écrit ou à l’oral</p>
          </div>
        </div>
        <p className="mt-2 text-[12.5px] leading-normal">{tip}</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => open('kia')}
            className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[9px] bg-violet-strong px-2.5 text-[11.5px] font-semibold text-white"
          >
            Parler à Kia
          </button>
          {pro && (
            <button
              type="button"
              onClick={() => open('qr')}
              className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[9px] bg-bg px-2.5 text-[11.5px] font-semibold text-violet-deep"
            >
              <QrIcon size={13} color="var(--color-violet-deep)" />
              Afficher mon QR
            </button>
          )}
        </div>
      </motion.section>

      {/* Dernières transactions */}
      <motion.div className="mt-4.5 mb-1 flex items-baseline justify-between" {...item(4)}>
        <h3 className="text-[14px] font-semibold">Dernières transactions</h3>
        <button type="button" onClick={() => open('history')} className="cursor-pointer text-[12px] font-medium text-violet-strong">
          Tout voir
        </button>
      </motion.div>
      <ul>
        {state.transactions.slice(0, 4).map((t) => (
          <TxRow key={t.id} t={t} />
        ))}
      </ul>
    </div>
  );
}
