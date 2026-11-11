import { s } from './dom.js';
// Local SVG radar (replaces Chart.js): nine axes, 0–100. Unplayed domains sit at the centre with a hollow marker.
export function radar(rows, { size = 280, label = '' } = {}) {
  const c = size / 2; const R = size / 2 - 34; const n = rows.length;
  const pt = (i, v) => { const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n; const r = (R * v) / 100; return [c + r * Math.cos(ang), c + r * Math.sin(ang)]; };
  const svg = s('svg', { viewBox: `0 0 ${size} ${size}`, class: 'radar', role: 'img', 'aria-label': label });
  for (const level of [25, 50, 75, 100]) svg.appendChild(s('polygon', { class: 'radar-grid', points: rows.map((_, i) => pt(i, level).join(',')).join(' ') }));
  rows.forEach((_, i) => { const [x, y] = pt(i, 100); svg.appendChild(s('line', { class: 'radar-axis', x1: c, y1: c, x2: x, y2: y })); });
  const g = s('g', { class: 'radar-data', style: { 'transform-origin': `${c}px ${c}px` } });
  g.appendChild(s('polygon', { class: 'radar-area', points: rows.map((r, i) => pt(i, r.played ? r.score : 0).join(',')).join(' ') }));
  rows.forEach((r, i) => { const [x, y] = pt(i, r.played ? r.score : 0); g.appendChild(s('circle', { class: r.played ? 'radar-dot' : 'radar-dot hollow', cx: x, cy: y, r: r.played ? 4 : 3 })); });
  svg.appendChild(g);
  rows.forEach((r, i) => { const [x, y] = pt(i, 119); svg.appendChild(s('text', { class: r.played ? 'radar-label' : 'radar-label muted', x, y: y + 4, 'text-anchor': 'middle' }, String(i + 1))); });
  return svg;
}
