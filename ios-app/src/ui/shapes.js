import { s } from './dom.js';

// Geometric symbols for Symbol Sprint, Memory Stack and Rule Shift. Drawn in currentColor on a 100×100 box.
const PATHS = {
  circle: () => s('circle', { cx: 50, cy: 50, r: 40 }),
  square: () => s('rect', { x: 12, y: 12, width: 76, height: 76, rx: 6 }),
  triangle: () => s('polygon', { points: '50,8 94,88 6,88' }),
  diamond: () => s('polygon', { points: '50,4 92,50 50,96 8,50' }),
  star: () => s('polygon', { points: '50,4 61.8,36.2 96,36.2 68.4,57 78.8,90 50,69.8 21.2,90 31.6,57 4,36.2 38.2,36.2' }),
  hexagon: () => s('polygon', { points: '26,8 74,8 98,50 74,92 26,92 2,50' }),
  cross: () => s('polygon', { points: '36,6 64,6 64,36 94,36 94,64 64,64 64,94 36,94 36,64 6,64 6,36 36,36' }),
  pentagon: () => s('polygon', { points: '50,4 96,38 78,94 22,94 4,38' }),
};
export const SHAPE_COLORS = { circle: '#4af0d8', square: '#a78bfa', triangle: '#f0c060', diamond: '#f87171', star: '#f0e060', hexagon: '#60d0f0', cross: '#80f0b0', pentagon: '#f0a060' };

export function shape(name, { size = 64, label = null, color = null } = {}) {
  const svg = s('svg', { viewBox: '0 0 100 100', width: size, height: size, class: 'shape', fill: color || 'currentColor', 'aria-hidden': label ? null : 'true', role: label ? 'img' : null, 'aria-label': label });
  svg.appendChild((PATHS[name] || PATHS.circle)());
  return svg;
}

let logoSeq = 0;
/** Cognisphere mark: gradient triangle, orbit with three points, letter C around a sphere. */
export function logo(size = 32) {
  const id = `lg${++logoSeq}`;
  const svg = s('svg', { viewBox: '0 0 512 512', width: size, height: size, class: 'logo', 'aria-hidden': 'true' });
  svg.append(
    s('defs', {},
      s('linearGradient', { id: `${id}a`, x1: '0', y1: '1', x2: '1', y2: '0' }, s('stop', { offset: '0', 'stop-color': '#3ef0dc' }), s('stop', { offset: '.55', 'stop-color': '#7c8cf8' }), s('stop', { offset: '1', 'stop-color': '#b26bff' })),
      s('radialGradient', { id: `${id}b`, cx: '.35', cy: '.7', r: '.8' }, s('stop', { offset: '0', 'stop-color': '#4af0d8' }), s('stop', { offset: '.6', 'stop-color': '#7a5cf0' }), s('stop', { offset: '1', 'stop-color': '#a855f7' })),
      s('radialGradient', { id: `${id}c`, cx: '.5', cy: '.55', r: '.75' }, s('stop', { offset: '0', 'stop-color': '#0b1030' }), s('stop', { offset: '1', 'stop-color': '#04051a' })),
    ),
    s('rect', { width: 512, height: 512, rx: 116, fill: `url(#${id}c)` }),
    s('polygon', { points: '256,78 436,384 76,384', fill: 'none', stroke: `url(#${id}a)`, 'stroke-width': 18, 'stroke-linejoin': 'round' }),
    s('circle', { cx: 256, cy: 276, r: 112, fill: 'none', stroke: `url(#${id}a)`, 'stroke-width': 4, opacity: '.55' }),
    s('path', { d: 'M 311 229 A 72 72 0 1 0 311 323', fill: 'none', stroke: `url(#${id}a)`, 'stroke-width': 17, 'stroke-linecap': 'round' }),
    s('circle', { cx: 256, cy: 276, r: 40, fill: `url(#${id}b)` }),
    s('circle', { cx: 256, cy: 164, r: 11, fill: '#efe6ff' }),
    s('circle', { cx: 159, cy: 332, r: 11, fill: '#d9fffa' }),
    s('circle', { cx: 353, cy: 332, r: 11, fill: '#f0dcff' }),
  );
  return svg;
}

// Line icons (24×24, stroke = currentColor).
const ICONS = {
  home: 'M4 11.5 12 4l8 7.5M6.5 10v9.5h11V10',
  games: 'M12 3.5 20.5 12 12 20.5 3.5 12zM12 8.5 15.5 12 12 15.5 8.500 12z',
  profile: 'M12 3v9M12 12l7.800 4.500M12 12l-7.800 4.500M12 3l7.800 4.500v9L12 21l-7.800-4.500v-9z',
  more: 'M5.500 12h.01M12 12h.01M18.500 12h.01',
  logic_bridge: 'M3 16c3-8 15-8 18 0M3 16v3M21 16v3M8 11.500V19M16 11.500V19M12 10v9',
  symbol_sprint: 'M13 2 5 13.500h6L10 22l9-12h-6.500z',
  memory_stack: 'M12 3 21 8l-9 5-9-5zM3 12.500l9 5 9-5M3 17l9 5 9-5',
  pattern_tri: 'M12 3.500 21.500 20h-19zM12 10.500 15.500 16.500h-7z',
  reality_rank: 'M4 6h10M4 12h7M4 18h4M18 5v14M18 19l-3-3M18 19l3-3',
  iceberg: 'M2 13.500h20M7 13.500 10.500 6l3 3.500 2-2 2.500 6M6 13.500l2 5.500h8l2.500-5.500',
  verbal_analogy: 'M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3',
  num_sequence: 'M3 17c2.500 0 2.500-10 5-10s2.500 10 5 10 2.500-10 5-10 2 5 3 5',
  rule_shift: 'M20 12a8 8 0 1 1-2.600-5.900M20 4v4.500h-4.500',
  chevron: 'M9 5l7 7-7 7',
  back: 'M15 5l-7 7 7 7',
  share: 'M12 15V3.500M8 7l4-4 4 4M5 12v7.500h14V12',
  play: 'M8 5v14l11-7z',
  up: 'M6 14l6-6 6 6',
  down: 'M6 10l6 6 6-6',
  close: 'M6 6l12 12M18 6 6 18',
  backspace: 'M9 5h11v14H9l-6-7zM13 9.500l5 5M18 9.500l-5 5',
  check: 'M5 12.500l4.500 4.500L19 7.500',
};
export function icon(name, size = 24) {
  const svg = s('svg', { viewBox: '0 0 24 24', width: size, height: size, class: 'icon', fill: name === 'play' ? 'currentColor' : 'none', stroke: 'currentColor', 'stroke-width': name === 'more' ? 2.6 : 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' });
  svg.appendChild(s('path', { d: ICONS[name] || ICONS.games }));
  return svg;
}
