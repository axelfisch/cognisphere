// Rule Shift — eight items, four "yes" and four "no", forced rule change at item 5.
// The rule shown is frozen inside each item and is the only thing used for scoring.
export const SHAPES = ['circle', 'square', 'triangle'];
export const ITEMS_COUNT = 8;
export const SHIFT_AT = 4; // zero-based index of the first item under the new rule

export function generate(rng) {
  const ruleA = rng.pick(SHAPES);
  const ruleB = rng.pick(SHAPES.filter((s) => s !== ruleA));
  const expected = rng.shuffle([true, true, true, true, false, false, false, false]);
  let lureUsed = false;
  const items = expected.map((match, i) => {
    const rule = i < SHIFT_AT ? ruleA : ruleB;
    let shape;
    if (match) shape = rule;
    else if (i >= SHIFT_AT && !lureUsed) { shape = ruleA; lureUsed = true; } // old-rule shape: must now be refused
    else shape = rng.pick(SHAPES.filter((s) => s !== rule));
    return { index: i, rule, shape, changed: i === SHIFT_AT };
  });
  return { ruleA, ruleB, items };
}

/** The single source of truth for scoring: compares the item's own frozen rule with its shape. */
export const expectedAnswer = (item) => item.shape === item.rule;
export const isCorrect = (item, saidYes) => saidYes === expectedAnswer(item);

/** Answer book: one answer per item index, later presses for the same item are ignored. */
export function createAnswerBook(items) {
  const answers = new Array(items.length).fill(null);
  return {
    answer(index, saidYes) {
      if (!Number.isInteger(index) || index < 0 || index >= items.length || answers[index] !== null) return null;
      answers[index] = isCorrect(items[index], saidYes);
      return answers[index];
    },
    get answered() { return answers.filter((a) => a !== null).length; },
    get correct() { return answers.filter((a) => a === true).length; },
    get complete() { return answers.every((a) => a !== null); },
    score() { return Math.round((answers.filter((a) => a === true).length / items.length) * 100); },
  };
}
