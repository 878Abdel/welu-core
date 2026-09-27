import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { fcfa } from '../../lib/format';
import { exportHistory, exportReceipt } from '../../lib/pdf';
import { errText, useToast } from '../../lib/toast';
import { ease } from '../../motion/easings';
import { useMotionPrefs } from '../../motion/MotionPrefs';
import { api, isFraud, tierLabel } from '../../services/api';
import type { MerchantApi, Op, Tab } from '../../state/useMerchant';
import { HouseSvg } from '../house/BrickHouse';
import { Dial } from '../ui/Dial';
import { ShapBars, Spinner } from '../xai/Xai';
import { KiaAvatar } from './KiaAvatar';
import { Avatar, QrIcon, ScreenTitle, StatusBar } from './parts';

const item = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: ease.settle, delay: 0.05 + i * 0.06 },
});

/** L'app commerçant complète, branchée sur le backend. */
export function MerchantScreens({ m, onLogout }: { m: MerchantApi; onLogout: () => void }) {
  const { tab, open } = m;
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [tab]);

  return (
    <div className="relative flex h-full flex-col bg-bg text-ink">
      <StatusBar />
      <div ref={scroller} className="no-scrollbar relative flex-1 overflow-y-auto">
        {tab === 'home' && <Home m={m} />}
        {tab === 'cash' && <Cash m={m} />}
        {tab === 'history' && <History m={m} />}
        {tab === 'kia' && <Kia m={m} />}
        {tab === 'profile' && <Profile m={m} onLogout={onLogout} />}
      </div>
      <TabBar tab={tab} open={open} pro={m.profile.segment !== 'particulier'} />
      <ReceiptModal m={m} />
    </div>
  );
}

/* ───────────── Barre d'onglets ───────────── */

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'home', label: 'Accueil', icon: <path d="M3 9l7-6 7 6v8H3z" fill="currentColor" /> },
  { id: 'history', label: 'Historique', icon: <path d="M4 5h12M4 10h12M4 15h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /> },
  { id: 'cash', label: 'Encaisser', icon: null },
  { id: 'kia', label: 'Kia', icon: <path d="M4 4h12v9H9l-4 3v-3H4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /> },
  {
    id: 'profile',
    label: 'Profil',
    icon: (
      <>
        <circle cx="10" cy="7" r="3.5" fill="currentColor" />
        <path d="M3 17c1.5-3.5 4-5 7-5s5.5 1.5 7 5" fill="currentColor" />
      </>
    ),
  },
];

function TabBar({ tab, open, pro }: { tab: Tab; open: (t: Tab) => void; pro: boolean }) {
  return (
    <nav className={`absolute inset-x-0 bottom-0 z-20 grid ${pro ? 'grid-cols-5' : 'grid-cols-4'} border-t border-line bg-bg/95 px-2 pt-1.5 pb-5 backdrop-blur`} aria-label="Navigation">
      {TABS.filter((t) => pro || t.id !== 'cash').map((t) =>
        t.id === 'cash' ? (
          <button key={t.id} type="button" onClick={() => open('cash')} className="-mt-5 flex cursor-pointer flex-col items-center gap-1" aria-label="Encaisser cash">
            <span className="grid size-[52px] place-items-center rounded-2xl bg-violet-strong shadow-[0_8px_20px_-6px_rgba(108,92,231,.7)]">
              <QrIcon size={24} />
            </span>
            <span className={`text-[10px] font-semibold ${tab === 'cash' ? 'text-violet-strong' : 'text-muted'}`}>{t.label}</span>
          </button>
        ) : (
          <button
            key={t.id}
            type="button"
            onClick={() => open(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`flex cursor-pointer flex-col items-center gap-1 pt-1 text-[10px] font-medium ${tab === t.id ? 'text-violet-strong' : 'text-faint'}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
              {t.icon}
            </svg>
            {t.label}
          </button>
        ),
      )}
    </nav>
  );
}

/* ───────────── Accueil ───────────── */

function Home({ m }: { m: MerchantApi }) {
  const { profile: p, audit, auditing, auditError, open } = m;
  const score = audit?.welu_score ?? 0;
  const gain = audit && m.firstScore != null ? audit.welu_score - m.firstScore : 0;
  const fraud = isFraud(audit);

  return (
    <div className="px-[18px] pb-28">
      <motion.div className="flex items-center justify-between pt-2 pb-3.5" {...item(0)}>
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]">Bonjour {p.name.split(' ')[0]}</h1>
          <p className="mt-0.5 truncate text-[12px] text-muted">{p.activity}</p>
        </div>
        <button type="button" onClick={() => open('profile')} aria-label="Profil" className="cursor-pointer">
          <Avatar name={p.name} />
        </button>
      </motion.div>

      <motion.section className={`overflow-hidden rounded-2xl border ${fraud ? 'border-alert bg-alert-tint' : 'border-line'}`} {...item(1)}>
        <div className="grid grid-cols-[104px_1fr] items-center gap-3 p-3.5">
          {audit ? (
            <Dial value={score} size={104} fromZero zones caption="sur 100" numberClass="text-[30px]" />
          ) : (
            <div className="grid size-[104px] place-items-center text-violet-strong">{auditing ? <Spinner className="size-7" /> : '—'}</div>
          )}
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold">Score Wëlu</h2>
            {audit ? (
              <>
                <span
                  className={`mt-1.5 inline-flex min-h-[22px] items-center rounded-full px-2 text-[11px] font-semibold ${
                    fraud ? 'bg-alert text-white' : score >= 70 ? 'bg-ok-tint text-ok' : 'bg-warn-tint text-[#9a6b00]'
                  }`}
                >
                  {tierLabel(audit.risk_rating)}
                </span>
                <p className="mt-1.5 text-[11px] text-muted">
                  {gain > 0 && <span className="font-semibold text-violet-strong">▲ +{gain} · </span>}
                  Audit GPU en {audit.latency_ms.toFixed(2)} ms
                </p>
              </>
            ) : (
              <p className="mt-1 text-[11.5px] text-muted">{auditError ? 'Audit indisponible' : 'Audit en cours sur GPU…'}</p>
            )}
            {auditError && (
              <button type="button" onClick={m.runAudit} className="mt-1 cursor-pointer text-[11.5px] font-semibold text-violet-strong underline">
                Réessayer
              </button>
            )}
          </div>
        </div>
        {audit && !fraud && (
          <div className="grid grid-cols-[1fr_118px] items-end gap-2.5 border-t border-line px-3.5 pt-2.5 pb-3">
            <p className="text-[11.5px] leading-[1.45] text-muted">
              <b className="font-semibold text-ink">Ma maison de confiance</b>
              <br />
              {p.segment === 'particulier' ? 'Chaque facture payée à l’heure ajoute une brique.' : 'Chaque vente certifiée ajoute une brique.'}
            </p>
            <HouseSvg score={score} className="w-[118px]" />
          </div>
        )}
        {fraud && audit?.alert && <p className="border-t border-alert/30 px-3.5 py-2.5 text-[11.5px] font-semibold text-alert">{audit.alert}</p>}
      </motion.section>

      {audit && (
        <motion.section className={`mt-3 rounded-[18px] p-3.5 text-white ${fraud ? 'bg-alert' : 'bg-violet-strong'}`} {...item(2)}>
          <p className="text-[10.5px] font-semibold tracking-[0.12em] text-white/70 uppercase">Décision de crédit</p>
          <p className="mt-1.5 text-[16px] leading-snug font-semibold">{audit.decision}</p>
          <div className="mt-3 flex gap-2">
            {p.segment !== 'particulier' && (
              <button type="button" onClick={() => open('cash')} className="h-8 cursor-pointer rounded-[10px] bg-white px-3 text-[12px] font-semibold text-violet-deep active:scale-[.97]">
                Encaisser cash
              </button>
            )}
            <button type="button" onClick={m.runAudit} disabled={m.auditing} className="h-8 cursor-pointer rounded-[10px] bg-white/15 px-3 text-[12px] font-semibold disabled:opacity-60">
              {m.auditing ? 'Audit…' : 'Recalculer'}
            </button>
          </div>
        </motion.section>
      )}

      {audit && (
        <motion.section className="mt-3 rounded-2xl border border-line p-3.5" {...item(3)}>
          <p className="mb-2.5 text-[13px] font-semibold">Ce qui compte dans mon score</p>
          <ShapBars shap={audit.xai_shap_breakdown} compact />
        </motion.section>
      )}

      <motion.section className="mt-3 rounded-2xl bg-tint p-3.5" {...item(4)}>
        <div className="flex items-center gap-2.5">
          <KiaAvatar size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-violet-deep">Kia · assistante vocale</p>
            <p className="text-[10.5px] text-muted">Dites votre vente en wolof, Kia l’enregistre</p>
          </div>
        </div>
        <button type="button" onClick={() => open('kia')} className="mt-2.5 h-7 cursor-pointer rounded-[9px] bg-violet-strong px-2.5 text-[11.5px] font-semibold text-white">
          Parler à Kia
        </button>
      </motion.section>

      <motion.div className="mt-4.5 mb-1 flex items-baseline justify-between" {...item(5)}>
        <h3 className="text-[14px] font-semibold">Dernières opérations</h3>
        <button type="button" onClick={() => open('history')} className="cursor-pointer text-[12px] font-medium text-violet-strong">
          Tout voir
        </button>
      </motion.div>
      <OpList ops={m.ops.slice(0, 3)} onOpen={m.showReceipt} />
    </div>
  );
}

/* ───────────── Encaisser cash ───────────── */

const AMOUNTS = [5000, 15000, 35000, 75000];

function Cash({ m }: { m: MerchantApi }) {
  const [amount, setAmount] = useState(15000);
  const [phone, setPhone] = useState('+221 77 542 12 34');
  const valid = amount > 0 && phone.replace(/\D/g, '').length >= 9;
  const code = `WELU:${m.profile.id}:CONFIRMER-VENTE:${amount}`;

  return (
    <div className="px-[18px] pb-28">
      <ScreenTitle title="Encaisser cash" />
      <div className="flex flex-col items-center rounded-2xl border border-line p-4">
        <div className="rounded-xl bg-bg p-2 ring-1 ring-line">
          <QRCodeSVG value={code} size={150} fgColor="#1b1530" />
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">Le client scanne ce QR pour confirmer la vente de {fcfa(amount)}.</p>
      </div>

      <p className="eyebrow mt-4 mb-2">Montant</p>
      <div className="grid grid-cols-4 gap-1.5">
        {AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAmount(a)}
            className={`h-9 cursor-pointer rounded-xl border text-[12px] font-semibold ${amount === a ? 'border-violet-strong bg-tint text-violet-deep' : 'border-line'}`}
          >
            {a / 1000}k
          </button>
        ))}
      </div>
      <label className="mt-2 flex h-10 items-center rounded-xl border border-line px-3 text-[13px] focus-within:border-violet-strong">
        <input
          type="number"
          min={100}
          step={100}
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full bg-transparent outline-none"
          aria-label="Montant en FCFA"
        />
        <span className="text-muted">FCFA</span>
      </label>

      <p className="eyebrow mt-4 mb-2">Téléphone du client (reçu WhatsApp)</p>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="h-10 w-full rounded-xl border border-line px-3 text-[13px] outline-none focus:border-violet-strong"
        aria-label="Téléphone du client"
      />

      <button
        type="button"
        disabled={!valid || m.cashing}
        onClick={() => m.cashIn(amount, phone)}
        className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-violet-strong text-[14px] font-semibold text-white disabled:opacity-60"
      >
        {m.cashing && <Spinner />}
        {m.cashing ? 'Validation QR + WhatsApp…' : `Encaisser ${fcfa(amount)}`}
      </button>
      <p className="mt-2 text-center text-[10.5px] leading-snug text-muted">Valide la vente sur le backend, envoie le reçu WhatsApp et met à jour le score.</p>
    </div>
  );
}

/* ───────────── Reçu ───────────── */

function ReceiptModal({ m }: { m: MerchantApi }) {
  const toast = useToast();
  const r = m.receipt;
  const [pdfBusy, setPdfBusy] = useState(false);

  const download = async () => {
    if (!r) return;
    setPdfBusy(true);
    try {
      await api.receipt({ amount: r.res.amount_fcfa, merchant: m.profile.name, client: r.phone, receipt_id: r.res.receipt_id });
      await exportReceipt(m.profile, r.res, r.phone, r.at);
    } catch (e) {
      toast(errText(e), 'error');
    } finally {
      setPdfBusy(false);
    }
  };

  if (!r) return null;
  // Pas d'animation de sortie : la fermeture doit être instantanée et fiable pendant la démo.
  return (
        <motion.div
          className="absolute inset-0 z-30 flex items-end bg-ink/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={m.closeReceipt}
        >
          <motion.div
            role="dialog"
            aria-label="Reçu de vente"
            className="no-scrollbar max-h-[92%] w-full overflow-y-auto rounded-t-[26px] bg-bg px-5 pt-4 pb-8"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.3, ease: ease.settle }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-line" />
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-ok text-white">✓</span>
              <div>
                <p className="text-[15px] font-semibold">Vente {r.res.status === 'VALIDATED' ? 'validée' : r.res.status}</p>
                <p className="text-[11.5px] text-muted">Reçu {r.res.receipt_id}</p>
              </div>
            </div>
            <p className="mt-3 text-[28px] font-semibold tracking-[-0.02em]">{fcfa(r.res.amount_fcfa)}</p>
            <p className="rounded-xl bg-tint px-3 py-2 text-[12px] font-medium text-violet-deep">{r.res.impact_score}</p>
            <div className="mt-3 flex items-center gap-3">
              <QRCodeSVG value={`https://welu.sn/verify/${r.res.receipt_id}`} size={84} fgColor="#1b1530" />
              <p className="min-w-0 text-[10.5px] break-all text-muted">
                Empreinte
                <br />
                <b className="text-ink">{r.res.qr_hash}</b>
              </p>
            </div>
            {r.wa && <pre className="mt-3 rounded-xl bg-surface p-3 font-sans text-[11px] leading-snug whitespace-pre-wrap">{r.wa.preview_text}</pre>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {r.wa ? (
                <a
                  href={r.wa.whatsapp_direct_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 items-center justify-center rounded-xl bg-[#25d366] text-[12.5px] font-semibold text-white"
                >
                  Ouvrir WhatsApp
                </a>
              ) : (
                <span className="flex h-11 items-center justify-center rounded-xl bg-surface text-[12px] text-muted">WhatsApp indisponible</span>
              )}
              <button
                type="button"
                onClick={download}
                disabled={pdfBusy}
                className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-violet-strong text-[12.5px] font-semibold text-white disabled:opacity-60"
              >
                {pdfBusy && <Spinner />}
                Reçu PDF
              </button>
            </div>
            <button type="button" onClick={m.closeReceipt} className="mt-2 h-10 w-full cursor-pointer rounded-xl text-[12.5px] font-semibold text-muted">
              Fermer
            </button>
          </motion.div>
        </motion.div>
  );
}

/* ───────────── Historique ───────────── */

function History({ m }: { m: MerchantApi }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);

  const onFile = (f: File) => {
    if (f.size > 4_000_000) return toast('Photo trop lourde (4 Mo max)', 'error');
    const reader = new FileReader();
    reader.onload = () => m.auditPaper(String(reader.result), f.name);
    reader.onerror = () => toast('Lecture de la photo impossible', 'error');
    reader.readAsDataURL(f);
  };

  return (
    <div className="px-[18px] pb-28">
      <ScreenTitle title="Historique" />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={async () => {
            setExporting(true);
            try {
              await exportHistory(m.profile, m.ops, m.audit?.welu_score ?? null);
            } catch (e) {
              toast(errText(e), 'error');
            } finally {
              setExporting(false);
            }
          }}
          disabled={exporting}
          className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-violet-strong text-[12px] font-semibold text-white disabled:opacity-60"
        >
          {exporting ? <Spinner /> : null}
          Exporter en PDF
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={m.paperBusy}
          className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-tint text-[12px] font-semibold text-violet-deep disabled:opacity-60"
        >
          {m.paperBusy && <Spinner />}
          {m.paperBusy ? 'Vision IA…' : 'Photo facture'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = '';
          }}
        />
      </div>
      <p className="mt-2 text-[10.5px] leading-snug text-muted">
        Photographiez une facture papier de votre grossiste : Llama 3.2 Vision (NVIDIA NIM) la lit et l’ajoute à votre score.
      </p>

      <p className="eyebrow mt-4 mb-1">Opérations certifiées</p>
      <OpList ops={m.ops} onOpen={m.showReceipt} />
    </div>
  );
}

function OpList({ ops, onOpen }: { ops: Op[]; onOpen: (o: Extract<Op, { kind: 'cash' }>) => void }) {
  if (!ops.length) return <p className="rounded-xl bg-surface px-3 py-3 text-[12px] text-muted">Aucune opération pour l’instant. Encaissez une vente ou parlez à Kia.</p>;
  return (
    <ul>
      {ops.map((o, i) => {
        const [title, sub, amount] =
          o.kind === 'cash'
            ? ['Vente cash', `QR certifié · ${o.id}`, o.res.amount_fcfa]
            : o.kind === 'voice'
              ? [`Note vocale · ${o.res.structured_data.produit ?? '—'}`, `${o.res.structured_data.type ?? 'transaction'} · NIM`, o.res.structured_data.montant ?? 0]
              : [`Facture · ${o.res.extracted_receipt.fournisseur ?? '—'}`, o.res.extracted_receipt.articles ?? 'Vision IA', o.res.extracted_receipt.montant_total ?? 0];
        const Row = o.kind === 'cash' ? 'button' : 'div';
        return (
          <motion.li
            key={o.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, ease: ease.settle, delay: i * 0.04 }}
            className="border-b border-line last:border-b-0"
          >
            <Row
              {...(o.kind === 'cash' ? { type: 'button' as const, onClick: () => onOpen(o) } : {})}
              className={`grid w-full grid-cols-[34px_1fr_auto] items-center gap-2.5 py-2.5 text-left ${o.kind === 'cash' ? 'cursor-pointer' : ''}`}
            >
              <span className="grid size-[34px] place-items-center rounded-[10px] bg-tint text-[14px]" aria-hidden>
                {o.kind === 'cash' ? '₣' : o.kind === 'voice' ? '🎙' : '🧾'}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-medium">{title}</span>
                <span className="block truncate text-[10.5px] text-muted">{sub}</span>
              </span>
              <span className="text-right text-[12.5px] font-semibold">
                {fcfa(amount)}
                <span className="block text-[10px] font-normal text-muted">{o.at.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </Row>
          </motion.li>
        );
      })}
    </ul>
  );
}

/* ───────────── Kia : voix wolof via NVIDIA NIM ───────────── */

const PHRASES = ['Dama jënd ñaari saaku ceeb ci cash 35000 francs', 'Jaay naa ñetti mètre bazin 45000', 'Dama fey Woyofal 5000'];

type Rec = { start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; lang: string };

function Kia({ m }: { m: MerchantApi }) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPrefs();

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [m.kia.length, m.kiaBusy]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const SR = (window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: new () => Rec }).webkitSpeechRecognition;

  const dictate = () => {
    if (!SR) return;
    const r = new SR();
    r.lang = 'fr-FR';
    r.onresult = (e) => setText(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    setListening(true);
    r.start();
  };

  const say = (key: string, t: string) => {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    if (speaking === key) return setSpeaking(null);
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'fr-FR';
    u.onend = () => setSpeaking(null);
    setSpeaking(key);
    s.speak(u);
  };

  const send = (t: string) => {
    if (!t.trim() || m.kiaBusy) return;
    m.askKia(t.trim());
    setText('');
  };

  return (
    <div className="flex min-h-full flex-col px-[18px] pb-28">
      <div className="flex items-center gap-3 pt-1.5 pb-3">
        <KiaAvatar size={44} />
        <div>
          <h1 className="text-[17px] font-semibold">Kia</h1>
          <p className="text-[11.5px] text-muted">Dites votre opération en wolof ou en français</p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {!m.kia.length && (
          <p className="max-w-[88%] rounded-2xl rounded-bl-md bg-tint px-3 py-2.5 text-[12.5px]">
            Nanga def ! Waxal ma sa jaay walla sa jënd, ma denc ko ci sa dossier. <span className="text-muted">(Dites-moi votre vente ou votre achat, je l’enregistre.)</span>
          </p>
        )}
        {m.kia.map((k) => (
          <div key={k.id} className="flex flex-col gap-2">
            <p className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-violet-strong px-3 py-2 text-[12.5px] text-white">🎙 {k.text}</p>
            {k.res && (
              <motion.div
                className="max-w-[90%] self-start rounded-2xl rounded-bl-md bg-tint px-3 py-2.5 text-[12.5px]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: ease.settle }}
              >
                <p className="font-semibold text-violet-deep">{k.res.ai_voice_response.wolof}</p>
                <p className="mt-1 text-muted">{k.res.ai_voice_response.francais}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10.5px]">
                  {Object.entries(k.res.structured_data).map(([a, b]) => (
                    <span key={a} className="rounded-md bg-bg px-1.5 py-0.5">
                      {a} : <b>{String(b)}</b>
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => say(`m${k.id}`, k.res!.ai_voice_response.francais)}
                  className="mt-2 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full bg-violet-strong px-2.5 text-[11px] font-semibold text-white"
                >
                  {speaking === `m${k.id}` ? '■ Arrêter' : '▶ Écouter (FR)'}
                </button>
              </motion.div>
            )}
            {k.error && <p className="max-w-[88%] self-start rounded-2xl bg-alert-tint px-3 py-2 text-[12px] text-alert">{k.error}</p>}
          </div>
        ))}
        {m.kiaBusy && (
          <p className="flex items-center gap-2 self-start rounded-2xl bg-tint px-3 py-2 text-[12px] text-violet-deep">
            <Spinner /> NVIDIA NIM analyse…
          </p>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-auto pt-4">
        <p className="eyebrow mb-2">Exemples</p>
        <div className="flex flex-col gap-1.5">
          {PHRASES.map((ph) => (
            <button
              key={ph}
              type="button"
              disabled={m.kiaBusy}
              onClick={() => send(ph)}
              className="cursor-pointer rounded-xl border border-violet/60 px-3 py-1.5 text-left text-[11.5px] text-violet-deep disabled:opacity-50"
            >
              {ph}
            </button>
          ))}
        </div>
        <form
          className="mt-2.5 flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          {SR && (
            <button
              type="button"
              onClick={dictate}
              aria-label="Dicter"
              className={`grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl ${listening ? 'bg-alert text-white' : 'bg-tint text-violet-deep'}`}
            >
              <motion.span animate={listening && !reduced ? { scale: [1, 1.25, 1] } : { scale: 1 }} transition={{ duration: 0.9, repeat: listening ? Infinity : 0 }}>
                🎙
              </motion.span>
            </button>
          )}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Waxal… (ex. jaay naa…)"
            className="h-10 min-w-0 flex-1 rounded-xl border border-line px-3 text-[12.5px] outline-none focus:border-violet-strong"
          />
          <button type="submit" disabled={!text.trim() || m.kiaBusy} className="h-10 cursor-pointer rounded-xl bg-violet-strong px-3 text-[12px] font-semibold text-white disabled:opacity-50">
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}

/* ───────────── Profil ───────────── */

function Profile({ m, onLogout }: { m: MerchantApi; onLogout: () => void }) {
  const { reduced, toggle } = useMotionPrefs();
  const p = m.profile;
  return (
    <div className="px-[18px] pb-28">
      <ScreenTitle title="Profil" />
      <div className="flex items-center gap-3 rounded-2xl border border-line p-3.5">
        <Avatar name={p.name} size={46} />
        <div className="min-w-0">
          <p className="text-[14px] font-semibold">{p.name}</p>
          <p className="text-[11.5px] text-muted">{p.activity}</p>
          <p className="text-[11px] text-muted">Dossier {p.id}</p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
        {[
          ['Wave / OM', `${fcfa(p.metrics.wave_om_volume_monthly)} / mois`],
          ['Woyofal', `${p.metrics.woyofal_streak_months} mois à l’heure`],
          ['SIM', `${p.metrics.sim_age_years} ans`],
          ['Ancrage marché', `${Math.round(p.metrics.market_geo_anchor_rate * 100)} %`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-surface px-3 py-2">
            <dt className="text-[11px] text-muted">{k}</dt>
            <dd className="font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        role="switch"
        aria-checked={reduced}
        onClick={toggle}
        className="mt-3 flex w-full cursor-pointer items-center justify-between rounded-2xl border border-line px-3.5 py-3 text-[12.5px]"
      >
        Réduire les animations
        <span className={`relative h-6 w-10 rounded-full transition-colors ${reduced ? 'bg-violet-strong' : 'bg-line'}`}>
          <motion.span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow" animate={{ x: reduced ? 16 : 0 }} transition={{ duration: 0.2 }} />
        </span>
      </button>
      <button type="button" onClick={onLogout} className="mt-3 h-10 w-full cursor-pointer rounded-xl border border-line text-[12.5px] font-semibold text-alert">
        Se déconnecter
      </button>
    </div>
  );
}
