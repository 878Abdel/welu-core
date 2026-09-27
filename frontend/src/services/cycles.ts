import type { FlowGraph } from '../data/types';

/**
 * Cycles orientés passant par `origin` (équivalent réduit de networkx.simple_cycles).
 * Le cycle est réellement calculé à partir des arêtes, pas codé en dur.
 */
export function findCyclesThrough(graph: FlowGraph, origin: string): string[][] {
  const next = new Map<string, string[]>();
  for (const e of graph.edges) next.set(e.from, [...(next.get(e.from) ?? []), e.to]);

  const cycles: string[][] = [];
  const walk = (node: string, path: string[]) => {
    for (const n of next.get(node) ?? []) {
      if (n === origin && path.length >= 2) cycles.push([...path]);
      else if (!path.includes(n)) walk(n, [...path, n]);
    }
  };
  walk(origin, [origin]);
  return cycles;
}

/** Arêtes d'un cycle, dans le sens du flux. */
export function cycleEdges(graph: FlowGraph, cycle: string[]) {
  return cycle.map((from, i) => {
    const to = cycle[(i + 1) % cycle.length];
    return graph.edges.find((e) => e.from === from && e.to === to)!;
  });
}
