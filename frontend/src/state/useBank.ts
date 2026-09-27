import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { ContributionKey, FraudAnalysis, MerchantProfile, Prospect, Segment, SourceKind } from '../data/types';
import { useMotionPrefs } from '../motion/MotionPrefs';
import { edgeTraceMs, FRAUD } from '../motion/timeline';
import { source } from '../services/scoringSource';
import { offerStatus, scoreOfContributions, solvency, type OfferStatus, type Solvency } from '../services/solvency';
import type { FraudStage } from './useWelu';

export interface FlowReview {
  profile: MerchantProfile;
  analysis: FraudAnalysis;
  stage: FraudStage;
}

interface State {
  segment: Segment;
  prospects: Prospect[];
  selectedId: string | null;
  /** Analyses de flux lancées, par prospect. */
  reviews: Record<string, FlowReview>;
  frozen: Record<string, boolean>;
  offersSent: Record<string, boolean>;
  modalFor: string | null;
  toast: { id: number; text: string } | null;
  source: SourceKind;
  error: string | null;
}

type Action =
  | { type: 'loaded'; prospects: Prospect[] }
  | { type: 'select'; id: string }
  | { type: 'segment'; segment: Segment }
  | { type: 'review'; id: string; review: FlowReview }
  | { type: 'stage'; id: string; stage: FraudStage }
  | { type: 'modal'; id: string | null }
  | { type: 'offer'; id: string }
  | { type: 'toast'; text: string | null }
  | { type: 'error'; message: string };

let seq = 0;

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'loaded':
      return { ...s, prospects: a.prospects, selectedId: s.selectedId ?? a.prospects[0]?.id ?? null };
    case 'segment':
      return { ...s, segment: a.segment, selectedId: s.prospects.find((p) => p.segment === a.segment)?.id ?? null };
    case 'select':
      return { ...s, selectedId: a.id };
    case 'review':
      return { ...s, reviews: { ...s.reviews, [a.id]: a.review }, modalFor: a.id, source: a.review.analysis.source };
    case 'stage': {
      const r = s.reviews[a.id];
      return {
        ...s,
        reviews: { ...s.reviews, [a.id]: { ...r, stage: a.stage } },
        frozen: a.stage === 'locked' ? { ...s.frozen, [a.id]: true } : s.frozen,
      };
    }
    case 'modal':
      return { ...s, modalFor: a.id };
    case 'offer':
      return { ...s, offersSent: { ...s.offersSent, [a.id]: true } };
    case 'toast':
      return { ...s, toast: a.text ? { id: ++seq, text: a.text } : null };
    case 'error':
      return { ...s, error: a.message };
  }
}

export interface ProspectView {
  p: Prospect;
  score: number;
  solv: Solvency;
  status: OfferStatus;
  frozen: boolean;
  inflated: Partial<Record<ContributionKey, number>>;
  inflatedTotal: number;
  review?: FlowReview;
  offerSent: boolean;
}

export function useBank() {
  const { reduced } = useMotionPrefs();
  const [state, dispatch] = useReducer(reducer, {
    segment: 'pro',
    prospects: [],
    selectedId: null,
    reviews: {},
    frozen: {},
    offersSent: {},
    modalFor: null,
    toast: null,
    source: source.kind,
    error: null,
  });
  const stateRef = useRef(state);
  stateRef.current = state;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const timers = useRef<number[]>([]);
  const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, reducedRef.current ? 0 : ms));

  useEffect(() => {
    source
      .listProspects()
      .then((prospects) => dispatch({ type: 'loaded', prospects }))
      .catch((e: Error) => dispatch({ type: 'error', message: e.message }));
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const all: ProspectView[] = useMemo(
    () =>
      state.prospects
        .map((p) => {
          const review = state.reviews[p.id];
          const frozen = !!state.frozen[p.id];
          const inflated: ProspectView['inflated'] = {};
          if (frozen && review) for (const i of review.analysis.inflated) inflated[i.key] = i.points;
          const solv = solvency(p.finances);
          const score = scoreOfContributions(p.contributions);
          // Signalement levé une fois l'analyse terminée sans cycle.
          const flagged = !!p.flowsFlagged && review?.stage !== 'clear';
          return {
            p,
            score,
            solv,
            status: offerStatus(score, solv, { frozen, flagged }),
            frozen,
            inflated,
            inflatedTotal: Object.values(inflated).reduce((a, b) => a + (b ?? 0), 0),
            review,
            offerSent: !!state.offersSent[p.id],
          };
        })
        .sort((a, b) => b.score - a.score),
    [state.prospects, state.reviews, state.frozen, state.offersSent],
  );

  const toast = (text: string) => {
    dispatch({ type: 'toast', text });
    at(3000, () => dispatch({ type: 'toast', text: null }));
  };

  const select = useCallback((id: string) => dispatch({ type: 'select', id }), []);
  const closeModal = useCallback(() => dispatch({ type: 'modal', id: null }), []);

  /** Analyse des flux : graphe, tracé du cycle arête par arête, puis gel du score. */
  const analyzeFlows = useCallback(async (id: string) => {
    const s = stateRef.current;
    if (s.reviews[id]) return dispatch({ type: 'modal', id });
    const p = s.prospects.find((x) => x.id === id);
    if (!p?.profileId) return;
    try {
      const [profile, analysis] = await Promise.all([source.getProfile(p.profileId), source.analyzeFraud(p.profileId)]);
      dispatch({ type: 'review', id, review: { profile, analysis, stage: 'graph' } });
      if (!analysis.cycles.length) return at(FRAUD.traceStart, () => dispatch({ type: 'stage', id, stage: 'clear' }));
      at(FRAUD.traceStart, () => dispatch({ type: 'stage', id, stage: 'tracing' }));
      at(FRAUD.traceStart + analysis.cycles[0].length * edgeTraceMs, () => dispatch({ type: 'stage', id, stage: 'locked' }));
    } catch (e) {
      dispatch({ type: 'error', message: (e as Error).message });
    }
  }, []);

  const sendOffer = useCallback((id: string) => {
    const p = stateRef.current.prospects.find((x) => x.id === id);
    dispatch({ type: 'offer', id });
    if (p) toast(`Offre envoyée à ${p.name}`);
  }, []);

  const views = all.filter((v) => v.p.segment === state.segment);
  const counts = { pro: all.filter((v) => v.p.segment === 'pro').length, particulier: all.filter((v) => v.p.segment === 'particulier').length };
  const requests = all.filter((v) => v.p.request).length;
  const setSegment = useCallback((segment: Segment) => dispatch({ type: 'segment', segment }), []);

  const selected = all.find((v) => v.p.id === state.selectedId) ?? null;
  const modal = all.find((v) => v.p.id === state.modalFor) ?? null;

  return { state, all, views, counts, requests, selected, modal, select, setSegment, analyzeFlows, closeModal, sendOffer };
}

export type BankApi = ReturnType<typeof useBank>;
