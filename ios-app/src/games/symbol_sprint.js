// Symbol Sprint — a stream of 30 symbols, one at a time. Tap when the symbol is one of the two targets.
// At most one response per stimulus. All symbols share the same colour and size: only the shape matters.
export const SHAPES = ['triangle', 'circle', 'square', 'diamond', 'star', 'hexagon', 'cross', 'pentagon'];
export const STIMULI = 30;
export const TARGETS = 12;
export const STIMULUS_MS = 850;
export const GAP_MS = 250;

export function generate(rng) {
  const targets = rng.sample(SHAPES, 2);
  const others = SHAPES.filter((s) => !targets.includes(s));
  const flags = rng.shuffle(Array.from({ length: STIMULI }, (_, i) => i < TARGETS));
  const stimuli = flags.map((isTarget) => ({ shape: rng.pick(isTarget ? targets : others), isTarget }));
  return { targets, stimuli };
}

/** Response log: one entry per stimulus; repeated presses on the same stimulus are ignored. */
export function createLog(stimuli) {
  const responded = new Array(stimuli.length).fill(false);
  return {
    /** Returns 'hit' | 'false_alarm' | null (ignored). */
    respond(index) {
      if (!Number.isInteger(index) || index < 0 || index >= stimuli.length || responded[index]) return null;
      responded[index] = true;
      return stimuli[index].isTarget ? 'hit' : 'false_alarm';
    },
    tally() { return tally(stimuli, responded); },
  };
}

export function tally(stimuli, responded) {
  let targets = 0; let hits = 0; let falseAlarms = 0;
  stimuli.forEach((s, i) => {
    if (s.isTarget) { targets += 1; if (responded[i]) hits += 1; } else if (responded[i]) falseAlarms += 1;
  });
  return { targets, hits, misses: targets - hits, falseAlarms, score: score({ targets, hits, falseAlarms }) };
}

/**
 * Bounded 0–100: (hits − false alarms) / targets.
 * No response → 0. One hit out of twelve → 8. Tapping everything → 0. Every target and no error → 100.
 */
export function score({ targets, hits, falseAlarms }) {
  if (!targets) return 0;
  return Math.max(0, Math.min(100, Math.round(((hits - falseAlarms) / targets) * 100)));
}
