import type { SourceKind } from '../../data/types';

/** Indique la vraie provenance des données affichées, lue dans la dernière réponse. */
export function SourceBadge({ source }: { source: SourceKind }) {
  const mock = source === 'mock';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm border border-line px-2 py-0.5 text-[10px] tracking-[0.12em] text-muted uppercase"
      title={mock ? 'Données fictives servies localement (src/data/profiles.ts). Aucun modèle appelé.' : 'Données servies par l’API de scoring.'}
    >
      <span className={`size-1.5 rounded-full ${mock ? 'border border-muted' : 'bg-fg'}`} />
      {mock ? 'Données simulées' : 'API connectée'}
    </span>
  );
}

/** Marqueur discret posé à côté de chaque valeur issue de données simulées. */
export function SimTag() {
  return (
    <span className="ml-1 align-[1px] text-[9px] tracking-[0.1em] text-dim uppercase" title="Valeur simulée">
      sim.
    </span>
  );
}
