import { AnimatePresence, motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { fcfa } from '../../lib/format';
import { ease } from '../../motion/easings';
import { useMotionPrefs } from '../../motion/MotionPrefs';
import type { ClientApi } from '../../state/useClient';
import { Avatar, ScreenTitle } from './parts';

export function QrScreen({ api, score }: { api: ClientApi; score: number }) {
  const { state, setQrMode } = api;
  const p = state.profile!;

  return (
    <div className="px-[18px] pb-28">
      <ScreenTitle title="QR Wëlu" right={<Avatar name={p.name} size={32} />} />
      <div className="grid grid-cols-2 rounded-xl bg-tint p-[3px]" role="tablist">
        {(['show', 'scan'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={state.qrMode === m}
            onClick={() => setQrMode(m)}
            className="relative cursor-pointer rounded-[9px] py-[7px] text-[12.5px] font-medium text-violet-deep"
          >
            {state.qrMode === m && (
              <motion.span
                layoutId="qr-seg"
                className="absolute inset-0 rounded-[9px] bg-bg shadow-[0_1px_3px_rgba(27,21,48,.1)]"
                transition={{ duration: 0.24, ease: ease.settle }}
              />
            )}
            <span className="relative">{m === 'show' ? 'Mon QR' : 'Scanner'}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={state.qrMode}
          initial={{ opacity: 0, x: state.qrMode === 'scan' ? 12 : -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: ease.settle }}
        >
          {state.qrMode === 'show' ? <ShowQr api={api} score={score} /> : <ScanQr api={api} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ShowQr({ api, score }: { api: ClientApi; score: number }) {
  const { state, simulateCustomerScan } = api;
  const p = state.profile!;
  const step = state.qrStep;
  // Vrai QR : un jury peut le scanner. Il contient l'identifiant commerçant, rien de sensible.
  const payload = `WELU:${p.merchantCode}:CONFIRMER-VENTE`;

  return (
    <>
      <section className="mt-3.5 rounded-2xl border border-line p-3.5 text-center">
        <p className="text-[13px] font-semibold">
          {p.name} · {p.trade.replace('Vente de ', '').replace(/^./, (c) => c.toUpperCase())}
        </p>
        <p className="mt-0.5 text-[11px] text-muted">Commerçant n° {p.merchantCode}</p>
        <div className="relative mx-auto mt-3 grid size-[172px] place-items-center rounded-[18px] border border-line bg-bg">
          <QRCodeSVG value={payload} size={148} level="H" fgColor="#1b1530" bgColor="transparent" />
          <span className="absolute grid size-[38px] place-items-center rounded-[10px] border-4 border-white bg-violet-strong text-[14px] font-bold text-white">
            W
          </span>
          <AnimatePresence>
            {step !== 'idle' && (
              <motion.div
                className="absolute inset-0 grid place-items-center rounded-[18px] bg-white/92"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {step === 'confirmed' ? (
                  <motion.span
                    className="grid size-14 place-items-center rounded-full bg-violet-strong"
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.28, ease: ease.snap }}
                  >
                    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
                      <path d="M6 13.5l4.5 4.5L20 8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.span>
                ) : (
                  <span className="text-[12px] font-medium text-violet-deep">Confirmation du client…</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-3.5 text-[12px] leading-normal text-muted" aria-live="polite">
          {step === 'confirmed' ? (
            <b className="font-semibold text-violet-deep">Vente certifiée. Elle compte pour votre score.</b>
          ) : (
            <>
              Votre client scanne ce code pour <b className="font-semibold text-ink">confirmer son achat</b>. La vente devient certifiée et
              compte pour votre score.
            </>
          )}
        </p>
      </section>

      <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-tint px-3 py-2.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full border-[3px] border-violet-strong bg-bg text-[14px] font-bold text-violet-deep">
          {score}
        </span>
        <p className="text-[11.5px] leading-snug text-muted">Présentez aussi ce QR à votre banque : il partage votre score, avec votre accord.</p>
      </div>

      {/* Démo : on ne peut pas faire scanner un vrai client sur scène. */}
      <button
        type="button"
        onClick={simulateCustomerScan}
        disabled={state.busy}
        className="mt-3 h-9 w-full cursor-pointer rounded-xl border border-dashed border-violet text-[12px] font-medium text-violet-deep disabled:opacity-50"
      >
        Démo · simuler le scan d’un client
      </button>
    </>
  );
}

function ScanQr({ api }: { api: ClientApi }) {
  const { state, simulateDetection, validatePayment } = api;
  const { reduced } = useMotionPrefs();
  const p = state.profile!;
  const step = state.qrStep;

  return (
    <>
      <div className="relative mt-3.5 h-[280px] overflow-hidden rounded-[22px] bg-[#16121f]">
        <div className="absolute top-[46%] left-1/2 size-[180px] -translate-x-1/2 -translate-y-1/2">
          {['top-0 left-0 border-r-0 border-b-0 rounded-tl-xl', 'top-0 right-0 border-l-0 border-b-0 rounded-tr-xl', 'bottom-0 left-0 border-r-0 border-t-0 rounded-bl-xl', 'bottom-0 right-0 border-l-0 border-t-0 rounded-br-xl'].map((c) => (
            <i key={c} className={`absolute size-8 border-[3px] border-white ${c}`} />
          ))}
          <AnimatePresence>
            {step === 'detected' || step === 'paid' ? (
              <motion.div
                key="ok"
                className="absolute inset-6 grid place-items-center rounded-lg bg-violet-strong/25"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.24, ease: ease.settle }}
              >
                <svg width="34" height="34" viewBox="0 0 26 26" aria-hidden>
                  <path d="M6 13.5l4.5 4.5L20 8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            ) : (
              // Ligne de balayage : transform uniquement ; immobile en mouvement réduit.
              <motion.span
                key="laser"
                className="absolute inset-x-1 top-1/2 h-0.5 bg-violet shadow-[0_0_12px_2px_rgba(165,148,249,.8)]"
                animate={reduced ? {} : { y: [-70, 70, -70] }}
                transition={{ duration: 2.4, ease: ease.glide, repeat: Infinity }}
              />
            )}
          </AnimatePresence>
        </div>
        <p className="absolute inset-x-0 bottom-4 text-center text-[12px] text-white/85">
          {step === 'detected' || step === 'paid' ? 'QR fournisseur reconnu' : 'Placez le QR dans le cadre'}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'detected' || step === 'paid' ? (
          <motion.div
            key="found"
            className="mt-3 grid grid-cols-[34px_1fr_auto] items-center gap-2.5 rounded-2xl border border-line p-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, ease: ease.settle }}
          >
            <span className="grid size-[34px] place-items-center rounded-[10px] bg-tint" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M3 8.5l3 3 7-7" stroke="var(--color-violet-strong)" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </span>
            <div className="min-w-0">
              <b className="block truncate text-[12.5px] font-semibold">{p.scanPreset.label}</b>
              <span className="text-[11px] text-muted">Paiement de {fcfa(p.scanPreset.amount)}</span>
            </div>
            {step === 'paid' ? (
              <span className="text-[11.5px] font-semibold text-violet-deep">Enregistré</span>
            ) : (
              <button
                type="button"
                onClick={validatePayment}
                disabled={state.busy}
                className="h-[30px] cursor-pointer rounded-[9px] bg-violet-strong px-2.5 text-[11.5px] font-semibold text-white"
              >
                Valider
              </button>
            )}
          </motion.div>
        ) : (
          <motion.button
            key="sim"
            type="button"
            onClick={simulateDetection}
            className="mt-3 h-9 w-full cursor-pointer rounded-xl border border-dashed border-violet text-[12px] font-medium text-violet-deep"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Démo · simuler la détection d’un QR fournisseur
          </motion.button>
        )}
      </AnimatePresence>
      <p className="mt-2.5 text-[11px] leading-[1.45] text-muted">
        Scannez le QR d’un fournisseur ou d’un client pour enregistrer un paiement. La caméra n’est pas branchée dans cette démo.
      </p>
    </>
  );
}
