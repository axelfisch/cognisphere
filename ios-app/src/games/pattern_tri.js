// Pattern Triangles — the rule is NOT given: the player infers it from three solved triangles
// (A top-left, B top-right, result at the bottom) and applies it to a fourth. The rule is revealed in the feedback.
export const RULES = [
  { id: 'sum_prod', fn: (a, b) => a + b + a * b, label: 'A + B + A × B' },
  { id: 'sq_plus', fn: (a, b) => a * a + b, label: 'A × A + B' },
  { id: 'prod_plus_a', fn: (a, b) => a * b + a, label: 'A × B + A' },
  { id: 'sum_sq', fn: (a, b) => (a + b) * (a + b), label: '(A + B) × (A + B)' },
  { id: 'double_plus', fn: (a, b) => 2 * a + b, label: '2 × A + B' },
  { id: 'prod_minus', fn: (a, b) => a * b - 1, label: 'A × B − 1' },
  { id: 'sum', fn: (a, b) => a + b, label: 'A + B' },
  { id: 'diff_sq', fn: (a, b) => a * a - b, label: 'A × A − B' },
];
export const ruleById = (id) => RULES.find((r) => r.id === id);
export const ROUNDS = 5;

const PAIRS = [];
for (let a = 2; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a !== b) PAIRS.push([a, b]);

/** Rules (from the whole set) that fit every example. A fair puzzle has exactly one. */
export function fittingRules(examples) {
  return RULES.filter((r) => examples.every(([a, b, v]) => r.fn(a, b) === v)).map((r) => r.id);
}

export function makeRound(rng, rule) {
  let picks = null;
  for (let attempt = 0; attempt < 50; attempt++) { // bounded search for examples that single out the rule
    const cand = rng.sample(PAIRS, 4);
    const examples = cand.slice(0, 3).map(([a, b]) => [a, b, rule.fn(a, b)]);
    const target = cand[3];
    const others = RULES.filter((r) => r.id !== rule.id);
    const unique = fittingRules(examples).length === 1;
    const targetDiscriminates = others.filter((r) => r.fn(...target) !== rule.fn(...target)).length >= 3;
    if (unique && targetDiscriminates && examples.every((e) => e[2] > 0) && rule.fn(...target) > 0) { picks = { examples, target }; break; }
  }
  if (!picks) { // deterministic fallback, verified by tests to be unambiguous for every rule
    picks = { examples: [[2, 3], [4, 1], [3, 5]].map(([a, b]) => [a, b, rule.fn(a, b)]), target: [5, 2] };
  }
  const [a, b] = picks.target;
  const answer = rule.fn(a, b);
  const wrong = new Set();
  for (const r of rng.shuffle(RULES)) { const v = r.fn(a, b); if (wrong.size < 3 && v > 0 && v !== answer) wrong.add(v); }
  for (const off of [1, -1, 2, -2, 3, 4, 5]) { const v = answer + off; if (wrong.size < 3 && v > 0 && v !== answer) wrong.add(v); }
  return { ruleId: rule.id, examples: picks.examples, a, b, answer, options: rng.shuffle([answer, ...wrong]) };
}

export function generate(rng) {
  return { rounds: rng.sample(RULES, ROUNDS).map((rule) => makeRound(rng, rule)) };
}
