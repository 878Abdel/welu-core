import type { ReactNode, Ref } from 'react';

interface Props {
  left: ReactNode;
  right: ReactNode;
  dividerRef: Ref<HTMLDivElement>;
}

/** 40 / 60 sur grand écran ; empilé sur mobile (l'impulsion traverse alors une séparation horizontale). */
export function SplitScreen({ left, right, dividerRef }: Props) {
  return (
    <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <section className="shrink-0 lg:w-[40%]" aria-label="Téléphone du commerçant">
        {left}
      </section>
      <div ref={dividerRef} className="h-px shrink-0 bg-line lg:h-auto lg:w-px" aria-hidden />
      <section className="min-w-0 flex-1 bg-panel lg:w-[60%]" aria-label="Console de l’analyste">
        {right}
      </section>
    </main>
  );
}
