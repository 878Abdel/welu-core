// ─────────────────────────────────────────────────────────────
// DONNÉES SIMULÉES. Personnes et chiffres fictifs, pensés pour être
// plausibles pour un commerce de Dakar. Aucune donnée réelle.
// Remplacées par l'API dès que VITE_API_URL est défini.
// ─────────────────────────────────────────────────────────────
import type { ContributionKey, MerchantProfile } from './types';

export const profiles: MerchantProfile[] = [
  {
    id: 'awa',
    segment: 'pro',
    activity: 'commerce',
    dossier: 'SN-DKR-0412',
    merchantCode: 'WL-0412',
    name: 'Awa Diop',
    trade: 'Vente de tissus',
    area: 'Sandaga',
    location: 'Marché Sandaga, Dakar',
    activeSince: 2019,
    strengths: ['Flux réguliers · 14 mois', 'Ancrage 6 ans', 'Électricité régulière'],
    finances: {
      revenue: 1900000,
      charges: [
        { label: 'Achats fournisseurs', amount: 1220000 },
        { label: 'Tontine', amount: 200000 },
        { label: 'Électricité', amount: 10000 },
      ],
    },
    advice: {
      text: 'Le samedi est votre meilleur jour, mais seules 4 ventes sur 10 y sont confirmées. Faites scanner votre QR à chaque vente : c’est ce qui fera le plus monter votre score.',
      action: { label: 'Afficher mon QR', target: 'qr' },
    },
    scanPreset: { label: 'Grossiste tissus · Colobane', amount: 305000 },
    contributions: [
      {
        key: 'geo_anchor',
        label: 'Ancrage géographique',
        points: 17,
        evidence: 'Même emplacement depuis 6 ans',
      },
      {
        key: 'mobile_money',
        label: 'Flux mobile money',
        points: 34,
        evidence: '14 mois · ≈ 1,9 M FCFA entrants / mois',
      },
      {
        key: 'electricity',
        label: 'Régularité des recharges d’électricité',
        points: 21,
        evidence: '13 recharges sur 14 mois · écart moyen 3 j',
      },
      {
        key: 'cash_certified',
        label: 'Encaissements cash certifiés',
        points: 19,
        evidence: '212 ventes confirmées par le client',
      },
    ],
    transactions: [
      { id: 'awa-3', label: 'Bazin brodé · 3 m', amount: 15000, channel: 'mobile_money', certified: false, time: '10:31' },
      { id: 'awa-2', label: 'Wax · 6 yards', amount: 24000, channel: 'cash', certified: true, time: '09:47' },
      { id: 'awa-1', label: 'Voile brodé', amount: 12500, channel: 'cash', certified: true, time: '09:12' },
    ],
    salePresets: [
      { label: 'Wax hollandais · 6 yards', amount: 18000 },
      { label: 'Bazin riche · 3 m', amount: 27000 },
      { label: 'Tissu lin · 4 m', amount: 22000 },
      { label: 'Wax · 12 yards', amount: 36000 },
      { label: 'Voile brodé', amount: 12500 },
    ],
    flows: {
      windowDays: 30,
      nodes: [
        { id: 'awa', label: 'Awa D.', role: 'merchant', x: 200, y: 100 },
        { id: 'clients', label: 'Clients', sublabel: '64 comptes', role: 'counterparty', x: 56, y: 48 },
        { id: 'supplier', label: 'Grossiste tissus', sublabel: 'Fournisseur', role: 'counterparty', x: 56, y: 156 },
        { id: 'tontine', label: 'Tontine', sublabel: 'Épargne', role: 'counterparty', x: 350, y: 48 },
        { id: 'woyofal', label: 'Électricité', sublabel: 'Prépayé', role: 'counterparty', x: 350, y: 156 },
      ],
      edges: [
        { id: 'e1', from: 'clients', to: 'awa', amount: 14500, count: 131 },
        { id: 'e2', from: 'awa', to: 'supplier', amount: 610000, count: 2 },
        { id: 'e3', from: 'awa', to: 'tontine', amount: 50000, count: 4 },
        { id: 'e4', from: 'awa', to: 'woyofal', amount: 10000, count: 1 },
      ],
    },
  },
  {
    id: 'moussa',
    segment: 'pro',
    activity: 'commerce',
    dossier: 'SN-DKR-0588',
    merchantCode: 'WL-0588',
    name: 'Moussa Ndiaye',
    trade: 'Grossiste alimentaire',
    area: 'Colobane',
    location: 'Colobane, Dakar',
    activeSince: 2021,
    strengths: ['Volume élevé', 'Clientèle nombreuse'],
    // Vu sans analyse des flux : les transferts circulaires passent pour du chiffre d'affaires.
    finances: {
      revenue: 3400000,
      charges: [
        { label: 'Achats fournisseurs', amount: 2350000 },
        { label: 'Loyer entrepôt', amount: 250000 },
      ],
    },
    scanPreset: { label: 'Importateur riz · Port', amount: 700000 },
    contributions: [
      {
        key: 'geo_anchor',
        label: 'Ancrage géographique',
        points: 12,
        evidence: 'Même emplacement depuis 3 ans',
      },
      {
        key: 'mobile_money',
        label: 'Flux mobile money',
        points: 41,
        evidence: '30 j · ≈ 3,4 M FCFA entrants',
      },
      {
        key: 'electricity',
        label: 'Régularité des recharges d’électricité',
        points: 14,
        evidence: '9 recharges sur 14 mois · irrégulier',
      },
      {
        key: 'cash_certified',
        label: 'Encaissements cash certifiés',
        points: 17,
        evidence: '164 ventes confirmées par le client',
      },
    ],
    transactions: [
      { id: 'mou-3', label: 'Transfert reçu · Compte B', amount: 450000, channel: 'mobile_money', certified: false, time: '10:05' },
      { id: 'mou-2', label: 'Sac de riz · 50 kg', amount: 17500, channel: 'cash', certified: true, time: '09:40' },
      { id: 'mou-1', label: 'Huile · bidon 20 L', amount: 24000, channel: 'cash', certified: true, time: '09:02' },
    ],
    salePresets: [
      { label: 'Sac de riz · 50 kg', amount: 17500 },
      { label: 'Sucre · 50 kg', amount: 31000 },
      { label: 'Huile · bidon 20 L', amount: 24000 },
      { label: 'Lait en poudre · carton', amount: 19500 },
    ],
    flows: {
      windowDays: 30,
      nodes: [
        { id: 'moussa', label: 'Moussa N.', role: 'merchant', x: 200, y: 100 },
        { id: 'clients', label: 'Clients', sublabel: '38 comptes', role: 'counterparty', x: 56, y: 48 },
        { id: 'supplier', label: 'Importateur', sublabel: 'Fournisseur', role: 'counterparty', x: 56, y: 156 },
        { id: 'acc_a', label: 'Compte A', sublabel: '77 ••• 41', role: 'counterparty', x: 350, y: 40 },
        { id: 'acc_b', label: 'Compte B', sublabel: '78 ••• 09', role: 'counterparty', x: 350, y: 164 },
      ],
      edges: [
        { id: 'e1', from: 'clients', to: 'moussa', amount: 6200, count: 112 },
        { id: 'e2', from: 'moussa', to: 'supplier', amount: 350000, count: 2 },
        { id: 'e3', from: 'moussa', to: 'acc_a', amount: 450000, count: 6 },
        { id: 'e4', from: 'acc_a', to: 'acc_b', amount: 450000, count: 6 },
        { id: 'e5', from: 'acc_b', to: 'moussa', amount: 450000, count: 6 },
      ],
    },
  },
];

/**
 * Part du score gonflée par les flux circulaires, révélée seulement si un cycle est détecté.
 * Côté backend : recalcul du modèle sans les arêtes du cycle.
 */
export const mockInflation: Record<string, { key: ContributionKey; points: number }[]> = {
  moussa: [{ key: 'mobile_money', points: 29 }],
};
