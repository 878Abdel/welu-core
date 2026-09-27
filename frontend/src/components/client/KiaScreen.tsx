import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ease } from '../../motion/easings';
import { useMotionPrefs } from '../../motion/MotionPrefs';
import { kiaSays, TOPICS, voiceFor, type Lang } from '../../services/kia';
import type { ClientApi } from '../../state/useClient';
import { KiaAvatar } from './KiaAvatar';

/** Kia : conseillère financière. Messages écrits et vocaux, en français ou en wolof. */
export function KiaScreen({ api, score }: { api: ClientApi; score: number }) {
  const { state, askKia, setLang } = api;
  const p = state.profile!;
  const lang = state.lang;
  const endRef = useRef<HTMLDivElement>(null);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [, forceVoices] = useState(0);

  // Les voix du navigateur se chargent de façon asynchrone.
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const on = () => forceVoices((n) => n + 1);
    window.speechSynthesis.addEventListener('voiceschanged', on);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', on);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Accolades obligatoires : scrollIntoView renvoie une Promise dans Chromium récent, que React refuserait comme nettoyage.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [state.kia.length]);

  const voice = voiceFor(lang);
  const play = (id: number, text: string) => {
    if (!voice) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    if (speaking === id) return setSpeaking(null);
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.95;
    u.onend = () => setSpeaking(null);
    u.onerror = () => setSpeaking(null);
    setSpeaking(id);
    synth.speak(u);
  };

  return (
    <div className="flex min-h-full flex-col px-[18px] pb-28">
      <div className="flex items-center gap-3 pt-1.5 pb-3">
        <KiaAvatar size={44} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[17px] font-semibold tracking-[-0.01em]">Kia</h1>
          <p className="text-[11.5px] text-muted">Conseillère financière</p>
        </div>
        <LangSwitch lang={lang} onChange={setLang} />
      </div>

      <div className="flex flex-col gap-2.5">
        {state.kia.map((m, i) => {
          const msg = kiaSays(m.topic, p, score, state.transactions);
          const text = msg[lang];
          const question = TOPICS.find((t) => t.id === m.topic);
          return (
            <div key={m.id} className="flex flex-col gap-2.5">
              {question && (
                <motion.p
                  className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-violet-strong px-3 py-2 text-[12.5px] text-white"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: ease.settle }}
                >
                  {question[lang]}
                </motion.p>
              )}
              <motion.div
                className="max-w-[88%] self-start rounded-2xl rounded-bl-md bg-tint px-3 py-2.5"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, ease: ease.settle, delay: question ? 0.25 : 0 }}
              >
                <VoiceNote playing={speaking === m.id} available={!!voice} onPlay={() => play(m.id, text)} seed={i} lang={lang} />
                <p className="mt-2 text-[12.5px] leading-normal">{text}</p>
              </motion.div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="mt-auto pt-4">
        <p className="eyebrow mb-2">{lang === 'fr' ? 'Demandez à Kia' : 'Laajal Kia'}</p>
        <div className="flex flex-wrap gap-1.5">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => askKia(t.id)}
              className="h-8 cursor-pointer rounded-full border border-violet/60 bg-bg px-3 text-[12px] font-medium text-violet-deep active:scale-[.97]"
            >
              {t[lang]}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[10px] leading-snug text-faint">
          Réponses calculées à partir de votre score et de vos transactions (données simulées). Wolof : traduction à faire valider par un locuteur natif.
        </p>
      </div>
    </div>
  );
}

function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex rounded-full bg-tint p-[3px] text-[11.5px] font-semibold" role="radiogroup" aria-label="Langue">
      {(['fr', 'wo'] as const).map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={lang === l}
          onClick={() => onChange(l)}
          className={`cursor-pointer rounded-full px-2.5 py-1 ${lang === l ? 'bg-violet-strong text-white' : 'text-violet-deep'}`}
        >
          {l === 'fr' ? 'Français' : 'Wolof'}
        </button>
      ))}
    </div>
  );
}

const BARS = 22;

/** Message vocal : bouton lecture et forme d'onde (transform uniquement). */
function VoiceNote({ playing, available, onPlay, seed, lang }: { playing: boolean; available: boolean; onPlay: () => void; seed: number; lang: Lang }) {
  const { reduced } = useMotionPrefs();
  const heights = Array.from({ length: BARS }, (_, i) => 0.3 + 0.7 * Math.abs(Math.sin((i + 1) * 1.7 + seed * 2.3)));
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={onPlay}
        disabled={!available}
        aria-label={playing ? 'Arrêter le message vocal' : 'Écouter le message vocal'}
        title={available ? undefined : lang === 'wo' ? 'Aucune voix wolof sur cet appareil : enregistrements à ajouter' : 'Synthèse vocale indisponible'}
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-violet-strong text-white disabled:cursor-not-allowed disabled:bg-faint"
      >
        {playing ? (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <rect x="1" y="1" width="3" height="8" rx="1" fill="currentColor" />
            <rect x="6" y="1" width="3" height="8" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <path d="M2 1l7 4-7 4z" fill="currentColor" />
          </svg>
        )}
      </button>
      <div className="flex h-6 flex-1 items-center gap-[2px]" aria-hidden>
        {heights.map((h, i) => (
          <motion.span
            key={i}
            className={`w-[3px] rounded-full ${available ? 'bg-violet' : 'bg-faint/50'}`}
            style={{ height: 24, originY: 0.5 }}
            initial={false}
            animate={playing && !reduced ? { scaleY: [h, Math.min(1, h + 0.35), h * 0.6, h] } : { scaleY: h }}
            transition={playing && !reduced ? { duration: 0.8, repeat: Infinity, delay: i * 0.03, ease: ease.glide } : { duration: 0.2 }}
          />
        ))}
      </div>
      <AnimatePresence initial={false}>
        {!available && (
          <motion.span className="text-[9.5px] leading-tight text-faint" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {lang === 'wo' ? 'audio wolof\nà enregistrer' : 'audio indisponible'}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
