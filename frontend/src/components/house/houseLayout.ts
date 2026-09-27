// Géométrie de la maison (repère SVG 260 × 176).
// Chaque élément porte un seuil de score : il est posé quand le score l'atteint.

export type Tier = 'foundation' | 'walls' | 'upper' | 'roof' | 'finish';

export interface BrickSpec {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tier: Tier;
  threshold: number;
  tone: string;
}

export const GROUND = 160;
export const HOUSE_LEFT = 20;
export const HOUSE_RIGHT = 180;
const H = 9;
const PITCH = 11;
const BW = 18;
const STEP = 20;
const MIN_W = 4;

// Un toit presque achevé à 91 : la maison se lit immédiatement.
// Les dernières ventes posent les finitions (porte, vitres, cheminée).
export const TIERS: { tier: Tier; label: string; from: number; to: number }[] = [
  { tier: 'foundation', label: 'Fondations', from: 0, to: 25 },
  { tier: 'walls', label: 'Murs', from: 25, to: 55 },
  { tier: 'upper', label: 'Haut des murs', from: 55, to: 75 },
  { tier: 'roof', label: 'Toit', from: 75, to: 95 },
  { tier: 'finish', label: 'Finitions', from: 95, to: 100 },
];

const rowY = (row: number) => GROUND - (row + 1) * PITCH;

const DOOR = { rows: [1, 4], x: [90, 110] };
const WINDOWS = [
  { rows: [3, 5], x: [38, 60] },
  { rows: [3, 5], x: [140, 162] },
];
/** Ouvertures : les briques y sont découpées proprement, comme sur un vrai chantier. */
const OPENINGS = [DOOR, ...WINDOWS];

type Span = [number, number];
type Rect = { x: number; y: number; w: number; h: number; tone: string };

function subtract([a, b]: Span, [oa, ob]: Span): Span[] {
  if (b <= oa || a >= ob) return [[a, b]];
  const out: Span[] = [];
  if (a < oa) out.push([a, oa - 2]);
  if (b > ob) out.push([ob + 2, b]);
  return out;
}

function course(left: number, right: number, row: number, cut: boolean): Span[] {
  const offset = row % 2 ? -STEP / 2 : 0;
  let spans: Span[] = [];
  for (let x = left + offset; x < right; x += STEP) {
    const a = Math.max(left, x);
    const b = Math.min(right, x + BW);
    if (b - a >= MIN_W) spans.push([a, b]);
  }
  if (cut) {
    for (const o of OPENINGS) {
      if (row >= o.rows[0] && row <= o.rows[1]) spans = spans.flatMap((s) => subtract(s, o.x as Span));
    }
  }
  return spans.filter(([a, b]) => b - a >= MIN_W);
}

const WALL_TONES = ['#d9d1fb', '#cfc5fa', '#e2dcfc', '#c8bdf8', '#d4cbfa'];
const ROOF_TONES = ['#a594f9', '#9a88f7', '#b0a1fa'];
const tone = (tones: string[], n: number) => tones[(n * 7) % tones.length];

function rectsByTier(): Record<Tier, Rect[]> {
  const rows = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i).flatMap((row, i) =>
      course(HOUSE_LEFT, HOUSE_RIGHT, row, true).map(([a, b], j) => ({
        x: a,
        y: rowY(row),
        w: b - a,
        h: H,
        tone: tone(WALL_TONES, i * 11 + j),
      })),
    );

  // Toit : 6 rangs de tuiles qui se resserrent, avec un débord.
  const roof = Array.from({ length: 6 }, (_, k) => k).flatMap((k) =>
    course(HOUSE_LEFT - 8 + k * 14, HOUSE_RIGHT + 8 - k * 14, k, false).map(([a, b], j) => ({
      x: a,
      y: rowY(8 + k),
      w: b - a,
      h: H,
      tone: tone(ROOF_TONES, k * 5 + j),
    })),
  );

  const doorTop = rowY(DOOR.rows[1]);
  const doorBottom = rowY(DOOR.rows[0]) + H;
  const panes = WINDOWS.flatMap((w) => {
    const top = rowY(w.rows[1]);
    const h = (rowY(w.rows[0]) + H - top - 2) / 2;
    const wd = (w.x[1] - w.x[0] - 2) / 2;
    return [0, 1].flatMap((r) =>
      [0, 1].map((c) => ({ x: w.x[0] + c * (wd + 2), y: top + r * (h + 2), w: wd, h, tone: '#efeaff' })),
    );
  });
  const chimney = [3, 4, 5].map((k) => ({ x: 150, y: rowY(8 + k), w: 14, h: H, tone: '#b9adf9' }));

  return {
    foundation: rows(0, 0),
    walls: rows(1, 4),
    upper: rows(5, 7),
    roof,
    finish: [
      { x: DOOR.x[0], y: doorTop, w: DOOR.x[1] - DOOR.x[0], h: doorBottom - doorTop, tone: '#6c5ce7' },
      ...panes,
      ...chimney,
    ],
  };
}

function build(): BrickSpec[] {
  const byTier = rectsByTier();
  const bricks: BrickSpec[] = [];
  for (const { tier, from, to } of TIERS) {
    const rects = byTier[tier];
    rects.forEach((r, k) => {
      bricks.push({
        ...r,
        id: `b${bricks.length}`,
        tier,
        // Seuils répartis régulièrement dans le palier ; le dernier élément = borne haute.
        threshold: from + ((k + 1) * (to - from)) / rects.length,
      });
    });
  }
  return bricks;
}

/** Triées par seuil croissant : l'ordre de pose. */
export const BRICKS = build();

/** Sommet le plus haut possible, pour normaliser la longueur de l'ombre. */
export const ROOF_TOP = Math.min(...BRICKS.map((b) => b.y));

export const tierOf = (score: number) => (score >= 100 ? null : TIERS.find((t) => score < t.to)!);
