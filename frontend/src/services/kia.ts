// Kia, conseillère financière de l'app client.
// Réponses calculées à partir du score, de l'offre et des transactions du client (règles, pas de modèle de langue).
// WOLOF : traduction de travail, à faire relire par un locuteur natif avant toute mise en production.
import type { MerchantProfile, Transaction } from '../data/types';
import { number } from '../lib/format';
import { offerFor, SOLVENCY_RULES, zoneOf } from './solvency';

export type KiaTopic = 'intro' | 'loan' | 'score' | 'money';
export type Lang = 'fr' | 'wo';

export interface KiaMessage {
  fr: string;
  wo: string;
}

export const TOPICS: { id: Exclude<KiaTopic, 'intro'>; fr: string; wo: string }[] = [
  { id: 'loan', fr: 'Puis-je emprunter ?', wo: 'Ndax mën naa jël bor ?' },
  { id: 'score', fr: 'Comment monter mon score ?', wo: 'Naka laay yokke sama score ?' },
  { id: 'money', fr: 'Comment gérer mon argent ?', wo: 'Naka laay saytu sama xaalis ?' },
];

export function kiaSays(topic: KiaTopic, p: MerchantProfile, score: number, txs: Transaction[]): KiaMessage {
  const first = p.name.split(' ')[0];
  const zone = zoneOf(score);
  const missing = Math.max(0, SOLVENCY_RULES.minScore - score);
  const pro = p.segment === 'pro';
  const short = offerFor(p.finances, 6);
  const house = offerFor(p.finances, 24);
  const inflow = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);

  switch (topic) {
    case 'intro':
      return {
        fr:
          `Bonjour ${first} ! Je suis Kia, votre conseillère financière. Votre score est de ${score} sur 100. ` +
          (zone === 'ok'
            ? 'Vous êtes éligible à un prêt.'
            : zone === 'warn'
              ? `Vous y êtes presque : encore ${missing} points pour être éligible.`
              : `Il vous manque ${missing} points pour être éligible. Je vais vous aider.`),
        wo:
          `Salaam aleekum ${first} ! Maa ngi tudd Kia, sa ndimbal ci wàllu xaalis. Sa score mooy ${score} ci 100. ` +
          (zone === 'ok' ? 'Mën nga jël bor.' : `Des na la ${missing} point ngir mën a jël bor.`),
      };
    case 'loan':
      return zone === 'ok'
        ? {
            fr: `Oui. Avec vos revenus, vous pouvez emprunter jusqu’à ${number(short.amount)} FCFA sur 6 mois, ou ${number(house.amount)} FCFA sur 24 mois pour construire votre maison. Choisissez votre projet dans l’onglet Prêts.`,
            wo: `Waaw. Mën nga jël bor bu tollu ci ${number(short.amount)} FCFA ci juróom-benni weer, walla ${number(house.amount)} FCFA ci ñaar-fukki weer ak ñeent ngir tabax sa kër.`,
          }
        : {
            fr: `Pas encore : il vous manque ${missing} points. Suivez mes conseils pendant quelques semaines et reposez-moi la question.`,
            wo: `Leegi deesul : des na la ${missing} point. Topp sama digal ay ayu-bés, te laaj ma ko ci kanam.`,
          };
    case 'score':
      return pro
        ? {
            fr: 'Faites scanner votre QR à chaque vente : chaque vente confirmée par un client compte pour votre score. Rechargez aussi votre électricité à dates régulières.',
            wo: 'Saa yu nga jaay, na sa kiliyaan scanne sa QR : loolu dafay yokk sa score. Te nanga yeesal sa kuuraŋ ci anam bu sax.',
          }
        : {
            fr: 'Cotisez à votre tontine chaque mois sans en sauter un, et rechargez votre électricité à dates régulières. La régularité compte plus que les montants.',
            wo: 'Faye sa natt weer wu nekk, bul ci jàll benn. Te nanga yeesal sa kuuraŋ ci anam bu sax. Li gën a am solo mooy sax, du xaalis bu bare.',
          };
    case 'money':
      return {
        fr: `Mettez de côté 10 % de chaque rentrée : sur vos ${number(inflow)} FCFA reçus récemment, cela fait ${number(Math.round(inflow / 10 / 100) * 100)} FCFA. ${pro ? 'Séparez l’argent de l’activité de celui du foyer.' : 'Gardez une réserve pour les imprévus du foyer.'}`,
        wo: `Denc 10 % ci lépp lu la dugg : ci ${number(inflow)} FCFA yi nga jot, loolu mooy ${number(Math.round(inflow / 10 / 100) * 100)} FCFA. ${pro ? 'Bul boole xaalisu liggéey ak xaalisu kër.' : 'Denc lu la dimbali su jamono bu metti ñëwee.'}`,
      };
  }
}

/** Voix disponibles dans le navigateur (aucune synthèse wolof n'existe en standard). */
export function voiceFor(lang: Lang): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang.toLowerCase().startsWith(lang === 'fr' ? 'fr' : 'wo')) ?? null;
}
