const fcfaFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export const fcfa = (n: number) => `${fcfaFormatter.format(n)} FCFA`;

export const number = (n: number) => fcfaFormatter.format(n);

/** Heure réelle de l'appareil (jamais une heure inventée). */
export const clock = (withSeconds = false) =>
  new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
  });
