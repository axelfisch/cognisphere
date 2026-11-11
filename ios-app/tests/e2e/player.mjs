// A "smart player" that completes each game through the real UI of the shipped bundle (www/), without test hooks.
// It solves items from what is on screen, using the content banks for the text games and its own solvers for generated games.
import * as LB from '../../src/games/logic_bridge.js';
import * as IC from '../../src/games/iceberg.js';
import * as PT from '../../src/games/pattern_tri.js';
import * as RR from '../../src/games/reality_rank.js';
import { strings } from '../../src/ui/i18n.js';

export const KEY = 'cognisphere_ios_v3';
export const readData = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
export const sessionsOf = async (page) => ((await readData(page)) || { sessions: [] }).sessions;

/** Independent Number Sequence solver: infers the rule from the five visible numbers. */
export function nextNumber(t) {
  const d = t.slice(1).map((v, i) => v - t[i]);
  if (d.every((x) => x === d[0])) return t[4] + d[0];
  if (t.slice(2).every((v, i) => v === t[i] + t[i + 1])) return t[3] + t[4];
  if (t.slice(1).every((v, i) => v * 2 === t[i])) return t[4] / 2;
  const r = t[1] / t[0]; if (Number.isInteger(r) && t.slice(1).every((v, i) => v === t[i] * r)) return t[4] * r;
  const roots = t.map(Math.sqrt); if (roots.every((x, i) => Number.isInteger(x) && (i === 0 || x === roots[i - 1] + 1))) return (roots[4] + 1) ** 2;
  if (d.slice(1).every((x, i) => x === d[i] + 1)) return t[4] + d[3] + 1;
  throw new Error(`unsolved sequence ${t}`);
}

async function mcGame(page, rounds, wrong, rightOption) {
  let correct = 0;
  for (let i = 0; i < rounds; i++) {
    await page.waitForSelector('.round .opt:not([disabled])');
    const right = String(await rightOption(page));
    const options = await page.$$eval('.round .opt', (els) => els.map((e) => e.dataset.option));
    if (!options.includes(right)) throw new Error(`right option ${right} not among ${options}`);
    const choice = i < wrong ? options.find((o) => o !== right) : right;
    if (choice === right) correct += 1;
    await page.click(`.round .opt[data-option="${choice}"]`);
    await page.click(`.round .opt[data-option="${choice}"]`, { force: true, timeout: 500 }).catch(() => {}); // second press must be ignored
    const marks = await page.$$eval('.round .opt', (els) => els.map((e) => [e.dataset.option, e.classList.contains('is-right'), e.classList.contains('is-wrong')]));
    if (marks.filter((m) => m[1]).length !== 1 || marks.find((m) => m[1])[0] !== right) throw new Error('feedback does not mark exactly the right option');
    await page.click('[data-action=next]');
  }
  return { score: Math.round((correct / rounds) * 100), correct, total: rounds };
}

const players = {
  logic_bridge: (page, { wrong = 0 }) => mcGame(page, 5, wrong, async (p) => LB.itemById(await p.getAttribute('.round', 'data-item-id')).answer),
  iceberg: (page, { wrong = 0 }) => mcGame(page, 3, wrong, async (p) => IC.itemById(await p.getAttribute('.round', 'data-item-id')).answer),
  verbal_analogy: (page, { wrong = 0 }) => mcGame(page, 5, wrong, async () => 0),
  num_sequence: (page, { wrong = 0 }) => mcGame(page, 5, wrong, async (p) => nextNumber(await p.$$eval('.seq .num:not(.q)', (els) => els.map((e) => Number(e.textContent))))),
  pattern_tri: (page, { wrong = 0 }) => mcGame(page, 5, wrong, async (p) => {
    const read = (sel) => p.$$eval(sel, (svgs) => svgs.map((svg) => [...svg.querySelectorAll('text')].map((t) => t.textContent)));
    const examples = (await read('.tris:not(.single) .tri')).map((x) => x.map(Number)); const [[a, b]] = await read('.tris.single .tri');
    const fits = PT.fittingRules(examples); if (fits.length !== 1) throw new Error(`examples fit ${fits.length} rules`);
    return PT.ruleById(fits[0]).fn(Number(a), Number(b));
  }),

  async rule_shift(page, { wrong = 0, lang }) {
    const S = strings(lang); let correct = 0; const seen = [];
    for (let i = 0; i < 8; i++) {
      await page.waitForSelector(`.round.shift[data-item-index="${i}"] .answer:not([disabled])`);
      const { rule, shape } = await page.$eval('.round.shift', (e) => ({ rule: e.dataset.rule, shape: e.dataset.shape }));
      const shownRule = await page.textContent('.rule-text'); const shownShape = await page.getAttribute('.stage .shape', 'aria-label');
      if (shownRule !== S.g.rsRuleTxt(S.g.shapes[rule])) throw new Error(`rule on screen "${shownRule}" differs from the scored rule ${rule}`);
      if (shownShape !== S.g.shapes[shape]) throw new Error('shape on screen differs from the scored shape');
      const changedNote = (await page.textContent('.changed-note')).trim();
      if ((i === 4) !== (changedNote !== '')) throw new Error(`change notice wrong at item ${i + 1}`);
      const truth = rule === shape; const say = i < wrong ? !truth : truth; if (say === truth) correct += 1;
      seen.push({ rule, truth });
      const btn = `[data-answer=${say ? 'yes' : 'no'}]`; const other = `[data-answer=${say ? 'no' : 'yes'}]`;
      await page.click(btn);
      await page.click(other, { force: true, timeout: 300 }).catch(() => {}); // rapid opposite press during the transition is ignored
    }
    if (seen.filter((x) => x.truth).length !== 4) throw new Error('not 4 yes / 4 no');
    if (new Set(seen.slice(0, 4).map((x) => x.rule)).size !== 1 || new Set(seen.slice(4).map((x) => x.rule)).size !== 1 || seen[3].rule === seen[4].rule) throw new Error('rule change is not exactly at item 5');
    return { score: Math.round((correct / 8) * 100), correct, total: 8 };
  },

  /** mode: 'perfect' | 'none' | 'one' | 'mixed' (all targets + 2 false alarms + repeated presses) */
  async symbol_sprint(page, { mode = 'perfect' }) {
    await page.waitForSelector('.targets[data-targets]');
    const targets = (await page.getAttribute('.targets', 'data-targets')).split(',');
    await page.click('[data-action=start]');
    let hits = 0; let fa = 0; let shownTargets = 0; let last = -1; const colors = new Set();
    for (;;) {
      const state = await page.evaluate(() => { const s = document.querySelector('.stage.sprint'); const r = document.querySelector('[data-screen=result]'); return r ? { done: true } : s ? { index: Number(s.dataset.index ?? -1), shape: s.dataset.shape || '', color: s.querySelector('.shape') ? getComputedStyle(s.querySelector('.shape')).fill : '' } : {}; });
      if (state.done) break;
      if (state.shape && state.index !== last) {
        last = state.index; colors.add(state.color);
        const isTarget = targets.includes(state.shape); if (isTarget) shownTargets += 1;
        const tap = () => page.dispatchEvent('[data-action=tap]', 'pointerdown');
        if (isTarget && (mode === 'perfect' || mode === 'mixed' || (mode === 'one' && hits === 0))) { await tap(); hits += 1; if (mode !== 'perfect') { await tap(); await page.click('[data-action=tap]', { timeout: 300 }).catch(() => {}); } }
        else if (!isTarget && mode === 'mixed' && fa < 2) { await tap(); await tap(); fa += 1; }
      }
      await page.waitForTimeout(40);
    }
    if (colors.size !== 1) throw new Error(`targets and distractors do not share one colour: ${[...colors]}`);
    if (last !== 29 || shownTargets !== 12) throw new Error(`expected 30 stimuli / 12 targets, saw ${last + 1} / ${shownTargets}`);
    return { score: Math.max(0, Math.min(100, Math.round(((hits - fa) / 12) * 100))), correct: hits, total: 12, rows: [12, hits, 12 - hits, fa] };
  },

  async memory_stack(page, { wrong = 0 }) {
    await page.waitForSelector('[data-phase=memorize]');
    const t0 = Date.now(); const seq = (await page.getAttribute('[data-phase=memorize]', 'data-sequence')).split(',');
    await page.waitForSelector('[data-phase=recall]', { timeout: 9000 });
    const exposure = Date.now() - t0; if (exposure < 4500 || exposure > 6500) throw new Error(`exposure lasted ${exposure} ms`);
    if (await page.$('[data-sequence]')) throw new Error('sequence still in the page after exposure');
    if ((await page.$$('.tiles.answer .tile.filled')).length !== 0) throw new Error('answer not empty');
    const symbols = ['circle', 'square', 'triangle', 'diamond', 'star', 'hexagon', 'cross', 'pentagon'];
    const press = (s) => page.click(`.key[data-symbol=${s}]`);
    // exercise editing: two wrong symbols, delete last, clear all
    await press(seq[1]); await press(seq[0]); await page.click('[data-action=backspace]');
    if ((await page.$$('.tiles.answer .tile.filled')).length !== 1) throw new Error('backspace did not remove one symbol');
    await page.click('[data-action=clear]'); if ((await page.$$('.tiles.answer .tile.filled')).length !== 0) throw new Error('clear did not empty the answer');
    if (!(await page.isDisabled('[data-action=submit]'))) throw new Error('submit enabled with an incomplete answer');
    const entry = seq.map((s, i) => (i < wrong ? symbols.find((x) => x !== s) : s));
    for (const s of entry) await press(s);
    await press(seq[0]); // seventh press is ignored
    if ((await page.$$('.tiles.answer .tile.filled')).length !== 6) throw new Error('entry is not six symbols');
    await page.click('[data-action=submit]');
    const correct = 6 - wrong; return { score: Math.round((correct / 6) * 100), correct, total: 6 };
  },

  /** order: 'exact' | 'swap' (first two swapped → 5 of 6 pairs) | 'reverse' */
  async reality_rank(page, { order = 'exact' }) {
    await page.waitForSelector('.round.rank-round');
    const item = RR.itemById(await page.getAttribute('.round.rank-round', 'data-item-id')); if (!item) throw new Error('unknown item');
    const add = (id) => page.click(`.pool .opt[data-option=${id}]`); const ranked = () => page.$$eval('.ranked-item', (els) => els.map((e) => e.dataset.option));
    // select, cancel, reorder
    await add('d'); await add('a'); if ((await ranked()).join('') !== 'da') throw new Error('selection order');
    if (!(await page.isDisabled('[data-action=submit]'))) throw new Error('submit enabled before all four are ranked');
    await page.click('.ranked-item[data-option=d] [data-action=remove]'); if ((await ranked()).join('') !== 'a') throw new Error('removal');
    await add('c'); await add('b'); await add('d'); // a c b d
    await page.click('.ranked-item[data-option=b] [data-action=up]'); if ((await ranked()).join('') !== 'abcd') throw new Error('reorder up');
    if (order === 'swap') await page.click('.ranked-item[data-option=a] [data-action=down]');
    if (order === 'reverse') { for (const id of ['a', 'a', 'a', 'b', 'b', 'c']) await page.click(`.ranked-item[data-option=${id}] [data-action=down]`); if ((await ranked()).join('') !== 'dcba') throw new Error('reverse'); }
    await page.click('[data-action=submit]');
    const pairs = { exact: 6, swap: 5, reverse: 0 }[order]; return { score: Math.round((pairs / 6) * 100), correct: pairs, total: 6 };
  },
};

export async function play(page, gameId, plan) { return players[gameId](page, plan); }
