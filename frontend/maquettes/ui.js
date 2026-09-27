// Dessins partagés des maquettes : cadran de score, maison en briques, QR factice.
const NS = 'http://www.w3.org/2000/svg';
const el = (name, attrs, parent) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
};

/** Cadran à 100 graduations sur 270°, identique à la console. */
export function drawDial(svg, value, { size = 120, lit = 'var(--violet-strong)', off = 'var(--line)', tainted = 0 } = {}) {
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  const c = size / 2, r2 = size * 0.46, r1 = size * 0.4, r1m = size * 0.36;
  for (let i = 0; i < 100; i++) {
    const a = ((-135 + (i * 270) / 99) * Math.PI) / 180;
    const r = i % 10 === 0 ? r1m : r1;
    const bad = tainted && i >= value - tainted && i < value;
    el('line', {
      x1: c + Math.sin(a) * r, y1: c - Math.cos(a) * r,
      x2: c + Math.sin(a) * r2, y2: c - Math.cos(a) * r2,
      stroke: bad ? 'var(--alert)' : i < value ? lit : off, 'stroke-width': size / 110, 'stroke-linecap': 'round',
    }, svg);
  }
}

/** Maison en briques : même géométrie que l'application, construite jusqu'à `score`. */
export function drawHouse(svg, score) {
  svg.setAttribute('viewBox', '8 0 184 170');
  const GROUND = 160, H = 9, PITCH = 11, BW = 18, STEP = 20, L = 20, R = 180;
  const openings = [{ rows: [1, 4], x: [90, 110] }, { rows: [3, 5], x: [38, 60] }, { rows: [3, 5], x: [140, 162] }];
  const rowY = (r) => GROUND - (r + 1) * PITCH;
  const course = (left, right, row, cut) => {
    let spans = [];
    for (let x = left + (row % 2 ? -STEP / 2 : 0); x < right; x += STEP) {
      const a = Math.max(left, x), b = Math.min(right, x + BW);
      if (b - a >= 4) spans.push([a, b]);
    }
    if (cut) for (const o of openings) if (row >= o.rows[0] && row <= o.rows[1])
      spans = spans.flatMap(([a, b]) => (b <= o.x[0] || a >= o.x[1]) ? [[a, b]] : [
        ...(a < o.x[0] ? [[a, o.x[0] - 2]] : []), ...(b > o.x[1] ? [[o.x[1] + 2, b]] : [])]);
    return spans.filter(([a, b]) => b - a >= 4);
  };
  const walls = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
    .flatMap((row) => course(L, R, row, true).map(([a, b]) => ({ x: a, y: rowY(row), w: b - a, h: H })));
  const roof = [0, 1, 2, 3, 4, 5].flatMap((k) => course(L - 8 + k * 14, R + 8 - k * 14, k, false)
    .map(([a, b]) => ({ x: a, y: rowY(8 + k), w: b - a, h: H, roof: true })));
  const tiers = [[walls(0, 0), 0, 25], [walls(1, 4), 25, 55], [walls(5, 7), 55, 75], [roof, 75, 95],
    [[{ x: 90, y: rowY(4), w: 20, h: rowY(1) + H - rowY(4), door: true }], 95, 100]];
  el('line', { x1: 8, x2: 192, y1: GROUND + 0.5, y2: GROUND + 0.5, stroke: 'var(--tint-2)' }, svg);
  const tones = ['#d9d1fb', '#cfc5fa', '#e2dcfc', '#c8bdf8'];
  let n = 0;
  for (const [rects, from, to] of tiers) rects.forEach((r, k) => {
    const threshold = from + ((k + 1) * (to - from)) / rects.length;
    if (score < threshold) return;
    el('rect', { x: r.x, y: r.y, width: r.w, height: r.h, rx: 1.5,
      fill: r.door ? 'var(--violet-strong)' : r.roof ? ['#a594f9', '#9a88f7', '#b0a1fa'][n % 3] : tones[(n * 7) % 4] }, svg);
    n++;
  });
}

/** QR de démonstration : motifs de repérage réels, modules pseudo-aléatoires (non scannable). */
export function drawQR(svg, seed = 7, color = svg.dataset.color || 'var(--ink)') {
  const N = 25;
  svg.setAttribute('viewBox', `-2 -2 ${N + 4} ${N + 4}`);
  svg.setAttribute('shape-rendering', 'crispEdges');
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const inFinder = (x, y) => [[0, 0], [N - 7, 0], [0, N - 7]].some(([fx, fy]) => x >= fx - 1 && x < fx + 8 && y >= fy - 1 && y < fy + 8);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (inFinder(x, y)) continue;
    if ((x === 6 || y === 6) ? (x + y) % 2 === 0 : rnd() > 0.52) el('rect', { x, y, width: 1, height: 1, fill: color }, svg);
  }
  for (const [fx, fy] of [[0, 0], [N - 7, 0], [0, N - 7]]) {
    el('rect', { x: fx + 0.5, y: fy + 0.5, width: 6, height: 6, fill: 'none', stroke: color, 'stroke-width': 1, rx: 1.2 }, svg);
    el('rect', { x: fx + 2, y: fy + 2, width: 3, height: 3, fill: color, rx: 0.6 }, svg);
  }
}

export function drawAll(root = document) {
  root.querySelectorAll('[data-dial]').forEach((s) =>
    drawDial(s, +s.dataset.dial, { size: +(s.dataset.size || 120), tainted: +(s.dataset.tainted || 0) }));
  root.querySelectorAll('[data-house]').forEach((s) => drawHouse(s, +s.dataset.house));
  root.querySelectorAll('[data-qr]').forEach((s) => drawQR(s, +s.dataset.qr));
}
