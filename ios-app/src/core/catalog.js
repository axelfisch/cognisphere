// Stable identifiers, independent from translations. Domain keys match the web app's storage keys.
export const GAMES = [
  { id: 'logic_bridge', domain: 'reasoning', legacyName: 'Logic Bridge', seconds: 60, color: '#a78bfa' },
  { id: 'symbol_sprint', domain: 'speed', legacyName: 'Symbol Sprint', seconds: 30, color: '#4af0d8' },
  { id: 'memory_stack', domain: 'memory', legacyName: 'Memory Stack', seconds: 30, color: '#f0c060' },
  { id: 'pattern_tri', domain: 'pattern', legacyName: 'Pattern Triangles', seconds: 90, color: '#60d0f0' },
  { id: 'reality_rank', domain: 'reality', legacyName: 'Reality Rank', seconds: 60, color: '#f87171' },
  { id: 'iceberg', domain: 'epistemic', legacyName: 'Iceberg Inference', seconds: 75, color: '#c0a0ff' },
  { id: 'verbal_analogy', domain: 'analogy', legacyName: 'Verbal Analogy', seconds: 45, color: '#80f0b0' },
  { id: 'num_sequence', domain: 'sequence', legacyName: 'Number Sequence', seconds: 60, color: '#f0a060' },
  { id: 'rule_shift', domain: 'flex', legacyName: 'Rule Shift', seconds: 30, color: '#f0e060' },
];
export const GAME_IDS = GAMES.map((g) => g.id);
export const DOMAIN_IDS = GAMES.map((g) => g.domain);
export const gameById = (id) => GAMES.find((g) => g.id === id) || null;
export const gameByDomain = (domain) => GAMES.find((g) => g.domain === domain) || null;
export const gameByLegacyName = (name) => GAMES.find((g) => g.legacyName === name) || null;
