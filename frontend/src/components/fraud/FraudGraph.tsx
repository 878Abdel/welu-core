import { motion } from 'framer-motion';
import type { FlowGraph, FraudAnalysis } from '../../data/types';
import { fcfa } from '../../lib/format';
import { ease } from '../../motion/easings';
import { useMotionPrefs } from '../../motion/MotionPrefs';
import { edgeTraceMs, FRAUD } from '../../motion/timeline';
import { cycleEdges } from '../../services/cycles';
import type { FraudStage } from '../../state/useWelu';
import { SimTag } from '../ui/SourceBadge';
import { FlowEdge } from './FlowEdge';

interface Props {
  graph: FlowGraph;
  analysis: FraudAnalysis;
  stage: FraudStage;
}

export function FraudGraph({ graph, analysis, stage }: Props) {
  const { reduced } = useMotionPrefs();
  const cycle = analysis.cycles[0];
  const cEdges = cycle ? cycleEdges(graph, cycle) : [];
  const cycleIds = new Set(cEdges.map((e) => e.id));
  const cycleNodes = new Set(cycle ?? []);
  const node = (id: string) => graph.nodes.find((n) => n.id === id)!;
  const center = cycle
    ? { x: cycle.reduce((s, id) => s + node(id).x, 0) / cycle.length, y: cycle.reduce((s, id) => s + node(id).y, 0) / cycle.length }
    : { x: 0, y: 0 };
  const tracing = stage === 'tracing' || stage === 'locked';
  const inflated = analysis.inflated.reduce((s, i) => s + i.points, 0);
  const mock = analysis.source === 'mock';

  return (
    <div className="flex h-full flex-col gap-3">
      <svg viewBox="0 0 440 206" className="max-h-[300px] min-h-0 w-full flex-1" role="img" aria-label="Graphe des flux financiers">
        {graph.edges
          .filter((e) => !cycleIds.has(e.id))
          .map((e, i) => (
            <motion.g
              key={e.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.24, delay: reduced ? 0 : 0.3 + i * 0.06 }}
            >
              <FlowEdge from={node(e.from)} to={node(e.to)} amount={e.amount} count={e.count} />
            </motion.g>
          ))}

        {tracing && (
          // Une seule pulsation lente une fois le cycle fermé, puis immobile.
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={stage === 'locked' && !reduced ? { scale: [1, 1.035, 1], opacity: [1, 0.75, 1] } : {}}
            transition={{ duration: FRAUD.pulse / 1000, ease: ease.glide }}
          >
            {cEdges.map((e, i) => (
              <FlowEdge
                key={e.id}
                from={node(e.from)}
                to={node(e.to)}
                amount={e.amount}
                count={e.count}
                cycle={{ step: i + 1, delayMs: i * edgeTraceMs, reduced, center }}
              />
            ))}
          </motion.g>
        )}

        {graph.nodes.map((n, i) => {
          const suspect = tracing && cycleNodes.has(n.id) && n.role !== 'merchant';
          const merchant = n.role === 'merchant';
          // Nœuds de droite : étiquette à droite, pour ne pas croiser les flux entrants.
          const side = n.x > 300;
          const tx = side ? n.x + 24 : n.x;
          const anchor = side ? 'start' : 'middle';
          return (
            <motion.g
              key={n.id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              transition={{ duration: 0.28, ease: ease.settle, delay: reduced ? 0 : (i * FRAUD.nodeStagger) / 1000 }}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={16}
                fill={merchant ? 'var(--color-violet-strong)' : 'var(--color-bg)'}
                stroke={suspect ? 'var(--color-alert)' : merchant ? 'var(--color-violet-strong)' : 'var(--color-faint)'}
              />
              <text x={tx} y={side ? n.y - 1 : n.y + 28} textAnchor={anchor} className={`text-[10.5px] ${suspect ? 'fill-alert' : 'fill-ink'} font-medium`}>
                {n.label}
              </text>
              {n.sublabel && (
                <text x={tx} y={side ? n.y + 11 : n.y + 39} textAnchor={anchor} className="fill-muted text-[9px]">
                  {n.sublabel}
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>

      <Summary
        stage={stage}
        windowDays={graph.windowDays}
        path={cycle ? [...cycle, cycle[0]].map((id) => node(id).label) : []}
        rotations={cEdges.length ? Math.min(...cEdges.map((e) => e.count)) : 0}
        recirculated={analysis.recirculated}
        inflated={inflated}
        mock={mock}
      />
    </div>
  );
}

function Summary(props: {
  stage: FraudStage;
  windowDays: number;
  path: string[];
  rotations: number;
  recirculated: number;
  inflated: number;
  mock: boolean;
}) {
  const { stage, windowDays, path, rotations, recirculated, inflated, mock } = props;

  if (stage === 'graph' || stage === 'tracing') {
    return (
      <div className="border-t border-line pt-3">
        <p className="eyebrow">Analyse en cours</p>
        <p className="mt-2 text-[12px] text-muted">Recherche de flux circulaires sur {windowDays} jours.</p>
      </div>
    );
  }
  if (stage === 'clear') {
    return (
      <motion.div className="border-t border-line pt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <p className="eyebrow">Résultat</p>
        <p className="mt-2 text-[14px] font-medium">Aucun flux circulaire</p>
        <p className="mt-1 text-[12px] text-muted">Les entrées viennent de clients distincts ; les sorties vont vers des fournisseurs et l’épargne.</p>
      </motion.div>
    );
  }
  const rows = [
    { k: 'Rotations', v: `${rotations} en ${windowDays} j` },
    { k: 'Montant recirculé', v: fcfa(recirculated) },
    { k: 'Points gonflés', v: `${inflated} pts` },
  ];
  return (
    <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 border-t border-line pt-3">
      <div>
        <p className="eyebrow text-alert!">Cycle détecté</p>
        <p className="mt-1.5 text-[12px] leading-relaxed">{path.join(' → ')}</p>
        <p className="mt-1 text-[11px] text-muted">Score gelé en attente de revue par un analyste.</p>
      </div>
      <dl className="flex flex-col">
        {rows.map((r, i) => (
          <motion.div
            key={r.k}
            className="flex justify-between border-b border-line py-1 text-[12px] last:border-b-0"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: ease.settle, delay: i * 0.06 }}
          >
            <dt className="text-muted">{r.k}</dt>
            <dd>
              {r.v}
              {mock && <SimTag />}
            </dd>
          </motion.div>
        ))}
      </dl>
    </div>
  );
}
