import { motion } from 'framer-motion';
import { useEffect, useState, type Ref } from 'react';
import { fcfa, clock } from '../../lib/format';
import type { WeluState } from '../../state/useWelu';
import { AnimatedNumber } from '../bank/AnimatedNumber';
import { IPhoneFrame } from '../ui/IPhoneFrame';
import { TransactionFeed } from './TransactionFeed';

interface Props {
  state: WeluState;
  originRef: Ref<HTMLLIElement>;
  onSale: () => void;
}

function useClock() {
  const [now, setNow] = useState(clock);
  useEffect(() => {
    const t = window.setInterval(() => setNow(clock()), 10_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function MerchantPane({ state, originRef, onSale }: Props) {
  const { profile, transactions, saleIndex, busy, phase } = state;
  const now = useClock();
  const next = profile ? profile.salePresets[saleIndex % profile.salePresets.length] : null;
  const total = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const initials = profile?.name.split(' ').map((w) => w[0]).join('') ?? '';
  const canSell = phase === 'bankable' && !busy;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-6">
      <p className="eyebrow">Vue commerçant · téléphone</p>
      <IPhoneFrame width={290} frameless="never">
        <div className="flex items-center justify-between px-7 pt-3.5 pb-2 text-[11px] font-medium">
          <span>{now}</span>
          <span className="text-muted">Wëlu</span>
        </div>

        <div className="flex items-center gap-3 px-4 pt-5 pb-4">
          <span className="flex size-9 items-center justify-center rounded-full border border-line text-[12px] font-medium">
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-medium">{profile?.name}</span>
            <span className="block truncate text-[11px] text-muted">{profile?.trade}</span>
          </span>
        </div>

        <div className="mx-4 rounded-2xl border border-line px-4 py-3.5">
          <p className="text-[11px] text-muted">Encaissé aujourd’hui</p>
          <p className="mt-1 text-[24px] font-medium tracking-[-0.02em]">
            <AnimatedNumber value={total} format={(v) => fcfa(v)} />
          </p>
          <p className="text-[11px] text-muted">{transactions.length} ventes</p>
        </div>

        <div className="px-4 pt-4 pb-5">
          <motion.button
            type="button"
            onClick={onSale}
            disabled={!canSell}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.09 }}
            className="block w-full cursor-pointer rounded-2xl bg-violet-strong px-4 py-3.5 text-left text-white transition-opacity disabled:cursor-default disabled:opacity-40"
          >
            <span className="block text-[13px] font-semibold">Enregistrer la vente</span>
            <span className="block truncate text-[11px] opacity-60">
              {next ? `${next.label} · ${fcfa(next.amount)}` : '—'}
            </span>
          </motion.button>
          <p className="mt-2 text-center text-[10px] text-muted">Vente cash · reçu confirmé par SMS au client</p>
        </div>

        <TransactionFeed transactions={transactions} originRef={originRef} />
      </IPhoneFrame>
    </div>
  );
}
