import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../src/core/rng.js';
import * as LB from '../../src/games/logic_bridge.js';
import * as VA from '../../src/games/verbal_analogy.js';
import * as IC from '../../src/games/iceberg.js';
import * as RR from '../../src/games/reality_rank.js';
import * as NS from '../../src/games/num_sequence.js';
import * as PT from '../../src/games/pattern_tri.js';
import * as RS from '../../src/games/rule_shift.js';
import * as SS from '../../src/games/symbol_sprint.js';
import * as MS from '../../src/games/memory_stack.js';

const SEEDS = Array.from({ length: 1500 }, (_, i) => i * 7919 + 1);
const uniq = (a) => new Set(a).size === a.length;

test('rng: deterministic, shuffle is a permutation and unbiased', () => {
  assert.deepEqual(createRng(42).shuffle([1, 2, 3, 4, 5]), createRng(42).shuffle([1, 2, 3, 4, 5]));
  const rng = createRng(7); const counts = [0, 0, 0, 0];
  for (let i = 0; i < 40000; i++) { const s = rng.shuffle([0, 1, 2, 3]); assert.equal(new Set(s).size, 4); counts[s[0]] += 1; }
  for (const c of counts) assert.ok(Math.abs(c - 10000) < 400, `first position count ${c}`);
});

test('content banks: both languages, stable unique ids, exactly one valid answer', () => {
  for (const bank of [LB.ITEMS, IC.ITEMS]) {
    assert.ok(uniq(bank.map((i) => i.id)));
    for (const item of bank) {
      assert.ok(uniq(item.o.map((o) => o.id)));
      assert.equal(item.o.filter((o) => o.id === item.answer).length, 1, item.id);
      for (const lang of ['en', 'fr']) { assert.ok(uniq(item.o.map((o) => o[lang])), `${item.id} ${lang} options`); assert.ok(item.why[lang].length > 20); item.o.forEach((o) => assert.ok(o[lang])); }
    }
  }
  LB.ITEMS.forEach((i) => ['en', 'fr'].forEach((l) => assert.equal(i.p[l].length, 2)));
  IC.ITEMS.forEach((i) => ['en', 'fr'].forEach((l) => assert.equal(i.clues[l].length, 3)));
  assert.ok(uniq(VA.ITEMS.map((i) => i.id)));
  for (const item of VA.ITEMS) for (const lang of ['en', 'fr']) {
    const d = item[lang]; assert.equal(d.o.length, 4); assert.ok(uniq(d.o), `${item.id} ${lang}`); assert.ok(d.a && d.b && d.c && d.why);
    assert.ok(!d.o.includes(d.a) && !d.o.includes(d.b), `${item.id} ${lang}: an option repeats a stem word`);
  }
  for (const item of RR.ITEMS) { assert.equal(item.o.length, 4); for (const lang of ['en', 'fr']) { assert.ok(uniq(item.o.map((o) => o[lang]))); assert.equal(item.clues[lang].length, 3); item.o.forEach((o) => assert.ok(o.why[lang])); } }
});

test('multiple-choice games: every session has the right length, no repeated item, shuffled answer position', () => {
  const firstIsAnswer = { lb: 0, ic: 0, va: 0 };
  for (const seed of SEEDS) {
    const lb = LB.generate(createRng(seed)); assert.equal(lb.rounds.length, 5); assert.ok(uniq(lb.rounds.map((r) => r.itemId)));
    lb.rounds.forEach((r) => { assert.equal(r.order.filter((id) => LB.isCorrect(r.itemId, id)).length, 1); if (LB.isCorrect(r.itemId, r.order[0])) firstIsAnswer.lb += 1; });
    const ic = IC.generate(createRng(seed)); assert.equal(ic.rounds.length, 3); assert.ok(uniq(ic.rounds.map((r) => r.itemId)));
    ic.rounds.forEach((r) => { assert.equal(r.order.filter((id) => IC.isCorrect(r.itemId, id)).length, 1); if (IC.isCorrect(r.itemId, r.order[0])) firstIsAnswer.ic += 1; });
    const va = VA.generate(createRng(seed)); assert.equal(va.rounds.length, 5); assert.ok(uniq(va.rounds.map((r) => r.itemId)));
    va.rounds.forEach((r) => { assert.deepEqual([...r.order].sort(), [0, 1, 2, 3]); if (r.order[0] === 0) firstIsAnswer.va += 1; });
  }
  const n = SEEDS.length;
  assert.ok(Math.abs(firstIsAnswer.lb / (n * 5) - 1 / 3) < 0.03); assert.ok(Math.abs(firstIsAnswer.ic / (n * 3) - 1 / 4) < 0.03); assert.ok(Math.abs(firstIsAnswer.va / (n * 5) - 1 / 4) < 0.03);
});

test('Number Sequence: series recomputed, answer correct, four unique positive options, deterministic cases', () => {
  for (const seed of SEEDS) {
    const m = NS.generate(createRng(seed)); assert.equal(m.rounds.length, 5); assert.ok(uniq(m.rounds.map((r) => r.kind)));
    for (const r of m.rounds) {
      assert.ok(NS.verify(r.kind, r.p, [...r.shown, r.answer]), `${r.kind} ${r.shown} -> ${r.answer}`);
      assert.equal(r.options.length, 4); assert.ok(uniq(r.options)); assert.ok(r.options.includes(r.answer)); assert.ok(r.options.every((o) => Number.isInteger(o) && o > 0));
      for (const lang of ['en', 'fr']) assert.ok(NS.EXPLAIN[r.kind][lang](r.p).length > 10);
    }
  }
  assert.ok(NS.verify('arith', { d: 3 }, [3, 6, 9, 12, 15, 18])); assert.ok(!NS.verify('arith', { d: 3 }, [3, 6, 9, 12, 15, 19]));
  assert.ok(NS.verify('halving', {}, [96, 48, 24, 12, 6, 3])); assert.ok(!NS.verify('halving', {}, [100, 50, 25, 12, 6, 3]), 'the web series with rounding is rejected');
  assert.ok(NS.verify('fib', {}, [1, 1, 2, 3, 5, 8])); assert.ok(NS.verify('squares', { o: 1 }, [1, 4, 9, 16, 25, 36])); assert.ok(NS.verify('geo', { r: 2 }, [2, 4, 8, 16, 32, 64]));
  assert.equal(NS.distractors(createRng(1), [2, 4, 8, 16, 32, 64]).length, 3);
  assert.equal(NS.distractors(createRng(1), [6, 5, 4, 3, 2, 1]).length, 3, 'bounded even when the answer is 1');
});

test('Pattern Triangles: examples single out one rule, solution recomputed, unique options', () => {
  for (const seed of SEEDS) {
    const m = PT.generate(createRng(seed)); assert.equal(m.rounds.length, 5); assert.ok(uniq(m.rounds.map((r) => r.ruleId)));
    for (const r of m.rounds) {
      const rule = PT.ruleById(r.ruleId);
      assert.deepEqual(PT.fittingRules(r.examples), [r.ruleId]);
      r.examples.forEach(([a, b, v]) => assert.equal(rule.fn(a, b), v));
      assert.equal(rule.fn(r.a, r.b), r.answer);
      assert.ok(!r.examples.some(([a, b]) => a === r.a && b === r.b), 'target differs from examples');
      assert.equal(r.options.length, 4); assert.ok(uniq(r.options)); assert.ok(r.options.includes(r.answer)); assert.ok(r.options.every((o) => o > 0));
    }
  }
  assert.equal(PT.ruleById('sum_prod').fn(2, 3), 11); assert.equal(PT.ruleById('sq_plus').fn(3, 2), 11); assert.equal(PT.ruleById('sum_sq').fn(2, 3), 25);
});

test('Rule Shift: 8 items, 4 yes / 4 no, forced change at item 5, frozen rule scores before and after the shift', () => {
  const yesAt = new Array(8).fill(0); const patterns = new Set();
  for (const seed of SEEDS) {
    const m = RS.generate(createRng(seed)); const it = m.items;
    assert.equal(it.length, 8); assert.notEqual(m.ruleA, m.ruleB);
    assert.equal(it.filter(RS.expectedAnswer).length, 4);
    it.forEach((item, i) => { assert.equal(item.rule, i < 4 ? m.ruleA : m.ruleB); assert.equal(item.changed, i === 4); if (RS.expectedAnswer(item)) yesAt[i] += 1; });
    patterns.add(it.map((i) => (RS.expectedAnswer(i) ? 'y' : 'n')).join(''));
    // a perfect player and its exact opposite
    const good = RS.createAnswerBook(it); const bad = RS.createAnswerBook(it);
    it.forEach((item, i) => { assert.equal(good.answer(i, RS.expectedAnswer(item)), true); assert.equal(bad.answer(i, !RS.expectedAnswer(item)), false); });
    assert.equal(good.score(), 100); assert.equal(bad.score(), 0);
    // constant strategies can never look good
    for (const constant of [true, false]) { const b = RS.createAnswerBook(it); it.forEach((_, i) => b.answer(i, constant)); assert.equal(b.score(), 50); }
    // a player who never switches rule loses points after the shift
    const stuck = RS.createAnswerBook(it); it.forEach((item, i) => stuck.answer(i, item.shape === m.ruleA));
    assert.ok(stuck.score() < 100);
  }
  yesAt.forEach((c) => assert.ok(Math.abs(c / SEEDS.length - 0.5) < 0.05, 'answer order is not predictable by position'));
  assert.equal(patterns.size, 70, 'all C(8,4) yes/no orders occur');
});

test('Rule Shift: the displayed rule is the scored rule (web bug: circle rule, circle shown, "yes" scored 0)', () => {
  const item = { index: 0, rule: 'circle', shape: 'circle', changed: false };
  assert.equal(RS.isCorrect(item, true), true); assert.equal(RS.isCorrect(item, false), false);
  const after = { index: 4, rule: 'square', shape: 'circle', changed: true };
  assert.equal(RS.isCorrect(after, false), true);
});

test('Rule Shift: fast double presses and presses for a previous item are ignored', () => {
  const m = RS.generate(createRng(3)); const book = RS.createAnswerBook(m.items);
  const first = book.answer(3, RS.expectedAnswer(m.items[3]));
  assert.equal(first, true);
  assert.equal(book.answer(3, !RS.expectedAnswer(m.items[3])), null, 'second press on item 4 at the transition');
  assert.equal(book.answer(3, true), null); assert.equal(book.answered, 1); assert.equal(book.correct, 1);
  assert.equal(book.answer(8, true), null); assert.equal(book.answer(-1, true), null);
});

test('Symbol Sprint: 30 stimuli, 12 targets, bounded score for every required scenario', () => {
  for (const seed of SEEDS) {
    const m = SS.generate(createRng(seed));
    assert.equal(m.stimuli.length, 30); assert.equal(m.stimuli.filter((s) => s.isTarget).length, 12); assert.equal(m.targets.length, 2);
    m.stimuli.forEach((s) => assert.equal(m.targets.includes(s.shape), s.isTarget));
  }
  const m = SS.generate(createRng(11)); const targets = m.stimuli.map((s, i) => (s.isTarget ? i : -1)).filter((i) => i >= 0); const others = m.stimuli.map((s, i) => (s.isTarget ? -1 : i)).filter((i) => i >= 0);
  let log = SS.createLog(m.stimuli);
  assert.deepEqual(log.tally(), { targets: 12, hits: 0, misses: 12, falseAlarms: 0, score: 0 }, 'no response');
  log = SS.createLog(m.stimuli); assert.equal(log.respond(targets[0]), 'hit');
  assert.deepEqual(log.tally(), { targets: 12, hits: 1, misses: 11, falseAlarms: 0, score: 8 }, 'one hit among several targets is not 100');
  assert.equal(log.respond(targets[0]), null); assert.equal(log.respond(targets[0]), null);
  assert.equal(log.tally().hits, 1, 'repeated presses count once');
  log = SS.createLog(m.stimuli); assert.equal(log.respond(others[0]), 'false_alarm'); assert.equal(log.respond(others[0]), null);
  assert.deepEqual(log.tally(), { targets: 12, hits: 0, misses: 12, falseAlarms: 1, score: 0 }, 'false alarm only, floor at 0');
  log = SS.createLog(m.stimuli); targets.forEach((i) => log.respond(i)); assert.equal(log.tally().score, 100, 'complete success');
  log.respond(others[0]); log.respond(others[1]); assert.equal(log.tally().score, 83, '12 hits, 2 false alarms');
  log = SS.createLog(m.stimuli); m.stimuli.forEach((_, i) => log.respond(i)); assert.equal(log.tally().score, 0, 'tapping everything');
  assert.equal(log.respond(-1), null); assert.equal(log.respond(30), null);
  assert.equal(SS.score({ targets: 0, hits: 0, falseAlarms: 0 }), 0);
});

test('Memory Stack: sequence, entry editing and positional score', () => {
  for (const seed of SEEDS.slice(0, 300)) { const m = MS.generate(createRng(seed)); assert.equal(m.sequence.length, 6); m.sequence.forEach((s, i) => { assert.ok(MS.SYMBOLS.includes(s)); if (i) assert.notEqual(s, m.sequence[i - 1]); }); }
  const seq = ['circle', 'square', 'star', 'circle', 'cross', 'diamond']; const e = MS.createEntry();
  seq.forEach((s) => assert.ok(e.push(s))); assert.ok(e.full); assert.equal(e.push('star'), false, 'no seventh symbol');
  assert.equal(MS.score(seq, e.value).score, 100);
  assert.ok(e.backspace()); assert.equal(e.value.length, 5); assert.ok(!e.full); e.push('star'); assert.deepEqual(MS.score(seq, e.value), { correct: 5, total: 6, score: 83 });
  e.clear(); assert.equal(e.value.length, 0); assert.equal(e.backspace(), false); assert.equal(e.push('nope'), false);
  assert.equal(MS.score(seq, ['square', 'circle', 'star', 'circle', 'cross', 'diamond']).correct, 4, 'right symbols in wrong positions do not count');
});

test('Reality Rank: select, cancel, reorder and pairwise partial score', () => {
  for (const item of RR.ITEMS) {
    const exp = RR.expectedOrder(item.id);
    assert.equal(RR.score(item.id, exp).score, 100); assert.equal(RR.score(item.id, [...exp].reverse()).score, 0);
    assert.equal(RR.score(item.id, [exp[1], exp[0], exp[2], exp[3]]).score, 83, 'one adjacent swap keeps 5 of 6 pairs');
    assert.equal(RR.score(item.id, [exp[0], exp[0], exp[2], exp[3]]).score, 0, 'invalid ranking'); assert.equal(RR.score(item.id, exp.slice(0, 3)).score, 0);
  }
  for (const seed of SEEDS.slice(0, 200)) { const m = RR.generate(createRng(seed)); assert.deepEqual([...m.display].sort(), ['a', 'b', 'c', 'd']); }
  const r = RR.createRanking(['c', 'a', 'd', 'b']);
  assert.ok(r.add('a')); assert.ok(!r.add('a')); assert.ok(r.add('b')); assert.ok(!r.add('z')); assert.deepEqual(r.pool, ['c', 'd']);
  assert.ok(r.remove('a')); assert.deepEqual(r.ranked, ['b']); assert.ok(!r.remove('a'));
  r.add('a'); r.add('c'); r.add('d'); assert.ok(r.complete); assert.deepEqual(r.ranked, ['b', 'a', 'c', 'd']);
  assert.ok(r.move('a', -1)); assert.deepEqual(r.ranked, ['a', 'b', 'c', 'd']); assert.ok(!r.move('a', -1)); assert.ok(!r.move('d', 1)); assert.ok(r.move('c', 1)); assert.deepEqual(r.ranked, ['a', 'b', 'd', 'c']);
});
