// Memory Stack — memorise six symbols, then enter them in order. Scored by position.
// Each symbol differs by shape and name as well as colour.
export const SYMBOLS = ['circle', 'square', 'triangle', 'diamond', 'star', 'hexagon', 'cross', 'pentagon'];
export const LENGTH = 6;
export const EXPOSURE_MS = 5000;

export function generate(rng) {
  const sequence = [];
  while (sequence.length < LENGTH) {
    const s = rng.pick(SYMBOLS);
    if (sequence[sequence.length - 1] !== s) sequence.push(s); // no immediate repeat
  }
  return { sequence };
}

export function createEntry(length = LENGTH) {
  const entry = [];
  return {
    get value() { return entry.slice(); },
    get full() { return entry.length === length; },
    push(symbol) { if (entry.length >= length || !SYMBOLS.includes(symbol)) return false; entry.push(symbol); return true; },
    backspace() { return entry.pop() !== undefined; },
    clear() { entry.length = 0; },
  };
}

export function score(sequence, entry) {
  const correct = sequence.filter((s, i) => entry[i] === s).length;
  return { correct, total: sequence.length, score: Math.round((correct / sequence.length) * 100) };
}
