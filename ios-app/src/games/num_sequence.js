// Number Sequence — generated series: five terms shown, the sixth is the answer.
// Every rule uses exact integer arithmetic (the halving rule only produces even terms, so there is no rounding).
export const KINDS = {
  arith: (rng) => { const a = rng.int(2, 9); const d = rng.int(2, 7); return { terms: seq(6, (k) => a + d * k), p: { d } }; },
  geo: (rng) => { const a = rng.int(1, 3); const r = rng.int(2, 3); return { terms: seq(6, (k) => a * r ** k), p: { r } }; },
  squares: (rng) => { const o = rng.int(1, 4); return { terms: seq(6, (k) => (k + o) ** 2), p: { o } }; },
  fib: (rng) => { const a = rng.int(1, 3); const b = a + rng.int(1, 3); const t = [a, b]; while (t.length < 6) t.push(t[t.length - 1] + t[t.length - 2]); return { terms: t, p: {} }; },
  growing: (rng) => { let v = rng.int(1, 5); const first = rng.int(2, 3); const t = [v]; for (let k = 0; k < 5; k++) { v += first + k; t.push(v); } return { terms: t, p: { first } }; },
  halving: (rng) => { const a = rng.pick([3, 5, 7, 9]); return { terms: seq(6, (k) => a * 2 ** (6 - k)), p: {} }; },
};
function seq(n, fn) { return Array.from({ length: n }, (_, k) => fn(k)); }

export const EXPLAIN = {
  arith: { en: (p) => `Add ${p.d} at each step.`, fr: (p) => `On ajoute ${p.d} à chaque étape.` },
  geo: { en: (p) => `Multiply by ${p.r} at each step.`, fr: (p) => `On multiplie par ${p.r} à chaque étape.` },
  squares: { en: (p) => `Squares of consecutive whole numbers, starting at ${p.o}² (${p.o} × ${p.o}).`, fr: (p) => `Carrés d’entiers consécutifs, à partir de ${p.o}² (${p.o} × ${p.o}).` },
  fib: { en: () => 'Each number is the sum of the two before it.', fr: () => 'Chaque nombre est la somme des deux précédents.' },
  growing: { en: (p) => `The step grows by 1 each time: +${p.first}, +${p.first + 1}, +${p.first + 2}…`, fr: (p) => `L’écart augmente de 1 à chaque fois : +${p.first}, +${p.first + 1}, +${p.first + 2}…` },
  halving: { en: () => 'Divide by 2 at each step. Every division is exact, with no remainder.', fr: () => 'On divise par 2 à chaque étape. Chaque division tombe juste, sans reste.' },
};

export const ROUNDS = 5;
const OFFSETS = [1, -1, 2, -2, 3, -3, 4, 5, 6, -4, 10, -10];

/** Three unique positive distractors, none equal to the answer. Bounded: no open-ended loop. */
export function distractors(rng, terms) {
  const answer = terms[5]; const last = terms[4]; const prevDiff = terms[4] - terms[3];
  const out = new Set();
  const tryAdd = (v) => { if (out.size < 3 && Number.isInteger(v) && v > 0 && v !== answer) out.add(v); };
  tryAdd(last + prevDiff); // "the last step repeats" — a plausible wrong rule
  for (const off of rng.shuffle(OFFSETS)) tryAdd(answer + off);
  for (let k = 7; out.size < 3 && k < 40; k++) tryAdd(answer + k); // deterministic fallback
  return [...out];
}

export function generate(rng) {
  const kinds = rng.sample(Object.keys(KINDS), ROUNDS);
  return { rounds: kinds.map((kind) => {
    const { terms, p } = KINDS[kind](rng);
    const answer = terms[5];
    return { kind, p, shown: terms.slice(0, 5), answer, options: rng.shuffle([answer, ...distractors(rng, terms)]) };
  }) };
}

/** Independent recomputation used by tests: does `terms` really follow `kind`? */
export function verify(kind, p, terms) {
  const step = (i) => terms[i + 1] - terms[i];
  switch (kind) {
    case 'arith': return terms.slice(1).every((_, i) => step(i) === p.d);
    case 'geo': return terms.slice(1).every((v, i) => v === terms[i] * p.r);
    case 'squares': return terms.every((v, k) => v === (k + p.o) * (k + p.o));
    case 'fib': return terms.slice(2).every((v, i) => v === terms[i] + terms[i + 1]);
    case 'growing': return terms.slice(1).every((_, i) => step(i) === p.first + i);
    case 'halving': return terms.slice(1).every((v, i) => terms[i] % 2 === 0 && v === terms[i] / 2);
    default: return false;
  }
}
