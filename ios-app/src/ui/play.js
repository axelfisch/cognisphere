// Views for the nine games. Each view receives a context bound to ONE session:
// every timer goes through ctx.session.after() and every handler through ctx.guard(), so nothing can
// outlive the session or fire while it is paused.
import { h, button, clear, s } from './dom.js';
import { shape, icon, SHAPE_COLORS } from './shapes.js';
import * as LB from '../games/logic_bridge.js';
import * as SS from '../games/symbol_sprint.js';
import * as MS from '../games/memory_stack.js';
import * as PT from '../games/pattern_tri.js';
import * as RR from '../games/reality_rank.js';
import * as IC from '../games/iceberg.js';
import * as VA from '../games/verbal_analogy.js';
import * as NS from '../games/num_sequence.js';
import * as RS from '../games/rule_shift.js';

const LETTERS = ['A', 'B', 'C', 'D'];
const pct = (a, b) => Math.round((a / b) * 100);

/** Multiple-choice round shared by five games. One answer, then explanation, then an explicit "Next". */
function mcRound(ctx, { itemId, prompt, options, isRight, why, grid, last, onDone }) {
  const { S, guard } = ctx;
  let answered = false;
  const fb = h('div', { class: 'fb', role: 'status', tabindex: '-1' });
  const buttons = options.map((opt, i) => button({ class: 'opt', dataset: { option: String(opt.id) }, onClick: guard(() => pick(i)) },
    h('span', { class: 'opt-letter', 'aria-hidden': 'true' }, LETTERS[i]), h('span', { class: 'opt-text' }, opt.label), h('span', { class: 'opt-mark', 'aria-hidden': 'true' })));
  function pick(i) {
    if (answered) return;
    answered = true;
    const ok = isRight(options[i].id);
    buttons.forEach((b, j) => {
      b.disabled = true;
      const right = isRight(options[j].id);
      if (right) { b.classList.add('is-right'); b.querySelector('.opt-mark').textContent = '✓'; }
      if (j === i && !ok) { b.classList.add('is-wrong'); b.querySelector('.opt-mark').textContent = '✕'; }
      if (j === i) b.setAttribute('aria-pressed', 'true');
    });
    ctx.haptic(ok ? 'success' : 'error');
    const rightLabel = options.find((o) => isRight(o.id)).label;
    clear(fb);
    fb.className = `fb show ${ok ? 'ok' : 'ko'}`;
    fb.append(h('div', { class: 'fb-title' }, ok ? S.play.ok : `${S.play.ko} · ${S.play.answerWas} ${rightLabel}`), why ? h('div', { class: 'fb-why' }, why) : null,
      button({ class: 'btn primary block', dataset: { action: 'next' }, onClick: guard(() => onDone(ok)) }, last ? S.play.seeResult : S.play.next));
    ctx.announce(`${ok ? S.play.ok : `${S.play.ko}. ${S.play.answerWas} ${rightLabel}`}. ${why || ''}`);
    fb.scrollIntoView({ block: 'nearest', behavior: ctx.reducedMotion ? 'auto' : 'smooth' });
  }
  ctx.render(h('div', { class: 'round', dataset: { itemId } }, prompt, h('div', { class: grid ? 'opts grid' : 'opts' }, buttons), fb));
}

function runRounds(ctx, rounds, showRound, finishExtra) {
  let i = 0; let correct = 0;
  const step = () => {
    if (i >= rounds.length) { ctx.finish({ score: pct(correct, rounds.length), correct, total: rounds.length, ...(finishExtra ? finishExtra() : {}) }); return; }
    ctx.progress(i, rounds.length);
    showRound(rounds[i], i, (ok) => { if (ok) correct += 1; i += 1; ctx.progress(i, rounds.length); step(); });
  };
  step();
}

const VIEWS = {
  logic_bridge(ctx) {
    const { S, lang } = ctx; const model = LB.generate(ctx.rng);
    runRounds(ctx, model.rounds, (round, i, done) => {
      const item = LB.itemById(round.itemId);
      const prompt = h('div', {}, h('div', { class: 'card stem' }, h('div', { class: 'eyebrow' }, S.g.premises), item.p[lang].map((p) => h('p', { class: 'premise' }, p))), h('p', { class: 'question' }, S.g.lbQ));
      mcRound(ctx, { itemId: item.id, prompt, options: round.order.map((id) => ({ id, label: item.o.find((o) => o.id === id)[lang] })), isRight: (id) => LB.isCorrect(item.id, id), why: item.why[lang], last: i === model.rounds.length - 1, onDone: done });
    });
  },

  iceberg(ctx) {
    const { S, lang } = ctx; const model = IC.generate(ctx.rng);
    runRounds(ctx, model.rounds, (round, i, done) => {
      const item = IC.itemById(round.itemId);
      const prompt = h('div', {}, h('div', { class: 'card stem' }, h('div', { class: 'eyebrow' }, S.g.clues), h('ul', { class: 'clues' }, item.clues[lang].map((c) => h('li', {}, c)))), h('p', { class: 'question' }, S.g.icQ));
      mcRound(ctx, { itemId: item.id, prompt, options: round.order.map((id) => ({ id, label: item.o.find((o) => o.id === id)[lang] })), isRight: (id) => IC.isCorrect(item.id, id), why: item.why[lang], last: i === model.rounds.length - 1, onDone: done });
    });
  },

  verbal_analogy(ctx) {
    const { S, lang } = ctx; const model = VA.generate(ctx.rng);
    runRounds(ctx, model.rounds, (round, i, done) => {
      const item = VA.itemById(round.itemId); const d = item[lang];
      const word = (w, cls) => h('span', { class: `word ${cls || ''}` }, w);
      const prompt = h('div', {}, h('div', { class: 'card stem analogy', 'aria-label': `${d.a} ${S.g.vaIsTo} ${d.b} ${S.g.vaAs} ${d.c} ${S.g.vaIsTo} …` },
        h('div', { class: 'pair', 'aria-hidden': 'true' }, word(d.a), h('span', { class: 'link' }, S.g.vaIsTo), word(d.b, 'b')),
        h('div', { class: 'as', 'aria-hidden': 'true' }, S.g.vaAs),
        h('div', { class: 'pair', 'aria-hidden': 'true' }, word(d.c), h('span', { class: 'link' }, S.g.vaIsTo), word('?', 'q'))), h('p', { class: 'question' }, S.g.vaQ));
      mcRound(ctx, { itemId: item.id, prompt, options: round.order.map((idx) => ({ id: idx, label: d.o[idx] })), isRight: (id) => VA.isCorrect(item.id, id), why: d.why, grid: true, last: i === model.rounds.length - 1, onDone: done });
    });
  },

  num_sequence(ctx) {
    const { S, lang } = ctx; const model = NS.generate(ctx.rng);
    runRounds(ctx, model.rounds, (round, i, done) => {
      const prompt = h('div', {}, h('p', { class: 'question lead' }, S.g.nsQ),
        h('div', { class: 'seq', role: 'img', 'aria-label': `${round.shown.join(', ')}, ?` }, round.shown.map((n) => h('span', { class: 'num' }, n)), h('span', { class: 'num q' }, '?')));
      mcRound(ctx, { itemId: `ns-${i}`, prompt, options: round.options.map((v) => ({ id: v, label: String(v) })), isRight: (v) => v === round.answer, why: NS.EXPLAIN[round.kind][lang](round.p), grid: true, last: i === model.rounds.length - 1, onDone: done });
    });
  },

  pattern_tri(ctx) {
    const { S } = ctx; const model = PT.generate(ctx.rng);
    const tri = (a, b, v, unknown) => {
      const svg = s('svg', { viewBox: '0 0 120 108', class: `tri ${unknown ? 'unknown' : ''}`, role: 'img', 'aria-label': unknown ? S.g.ptTarget(a, b) : S.g.ptExample(a, b, v) });
      svg.append(s('polygon', { points: '60,6 114,102 6,102', class: 'tri-shape' }),
        s('text', { x: 45, y: 62, class: 'tri-n' }, String(a)), s('text', { x: 75, y: 62, class: 'tri-n' }, String(b)),
        s('line', { x1: 34, y1: 72, x2: 86, y2: 72, class: 'tri-line' }), s('text', { x: 60, y: 94, class: 'tri-v' }, unknown ? '?' : String(v)));
      return svg;
    };
    runRounds(ctx, model.rounds, (round, i, done) => {
      const rule = PT.ruleById(round.ruleId);
      const prompt = h('div', {}, h('p', { class: 'question lead' }, S.g.ptQ),
        h('div', { class: 'tris' }, round.examples.map(([a, b, v]) => tri(a, b, v, false))), h('div', { class: 'tris single' }, tri(round.a, round.b, null, true)));
      mcRound(ctx, { itemId: `pt-${round.ruleId}`, prompt, options: round.options.map((v) => ({ id: v, label: String(v) })), isRight: (v) => v === round.answer,
        why: `${S.g.ptRule} ${rule.label}. A = ${round.a}, B = ${round.b} → ${round.answer}.`, grid: true, last: i === model.rounds.length - 1, onDone: done });
    });
  },

  rule_shift(ctx) {
    const { S, guard, session } = ctx; const model = RS.generate(ctx.rng); const book = RS.createAnswerBook(model.items);
    let index = 0;
    const show = () => {
      const item = model.items[index]; const shown = index;
      ctx.progress(index, model.items.length);
      const fb = h('div', { class: 'fb inline', role: 'status' });
      const yes = button({ class: 'btn answer yes', dataset: { answer: 'yes' } }, '✓ ', S.g.yes);
      const no = button({ class: 'btn answer no', dataset: { answer: 'no' } }, '✕ ', S.g.no);
      const answer = guard((saidYes) => {
        const ok = book.answer(shown, saidYes); // bound to the item that was on screen; a second press returns null
        if (ok === null) return;
        yes.disabled = true; no.disabled = true;
        (saidYes ? yes : no).classList.add(ok ? 'is-right' : 'is-wrong');
        fb.className = `fb inline show ${ok ? 'ok' : 'ko'}`; fb.textContent = ok ? S.play.ok : S.play.ko;
        ctx.haptic(ok ? 'success' : 'error'); ctx.announce(ok ? S.play.ok : S.play.ko);
        ctx.progress(shown + 1, model.items.length);
        session.after(650, () => {
          if (book.complete) { ctx.finish({ score: book.score(), correct: book.correct, total: model.items.length }); return; }
          index = shown + 1; show();
        });
      });
      yes.addEventListener('click', () => answer(true)); no.addEventListener('click', () => answer(false));
      const ruleText = S.g.rsRuleTxt(S.g.shapes[item.rule]);
      ctx.render(h('div', { class: 'round shift', dataset: { itemIndex: String(shown), rule: item.rule, shape: item.shape } },
        h('div', { class: `card rule ${item.changed ? 'changed' : ''}` }, h('div', { class: 'eyebrow' }, S.g.rsRule), h('div', { class: 'rule-text' }, ruleText)),
        h('div', { class: 'changed-note', 'aria-hidden': item.changed ? null : 'true' }, item.changed ? `↻ ${S.g.rsChanged}` : ''),
        h('div', { class: 'stage' }, shape(item.shape, { size: 96, label: S.g.shapes[item.shape] })),
        h('p', { class: 'question center' }, S.g.rsQ), h('div', { class: 'answers' }, yes, no), fb));
      if (item.changed) { ctx.haptic('warning'); ctx.announce(`${S.g.rsChanged}. ${ruleText}`); }
    };
    show();
  },

  symbol_sprint(ctx) {
    const { S, guard, session } = ctx; const model = SS.generate(ctx.rng); const log = SS.createLog(model.stimuli);
    const names = model.targets.map((t) => S.g.shapes[t]);
    const begin = guard(() => {
      let current = -1;
      const stage = h('div', { class: 'stage sprint', 'aria-live': 'off' });
      const fb = h('div', { class: 'fb inline', role: 'status' });
      const tap = guard(() => {
        const kind = log.respond(current); // one response per stimulus, extra presses ignored
        if (!kind) return;
        fb.className = `fb inline show ${kind === 'hit' ? 'ok' : 'ko'}`; fb.textContent = kind === 'hit' ? S.g.ssHit : S.g.ssFa;
        stage.classList.add(kind === 'hit' ? 'flash-ok' : 'flash-ko');
        ctx.haptic(kind === 'hit' ? 'tap' : 'error');
      });
      const tapBtn = button({ class: 'btn primary tap', dataset: { action: 'tap' } }, S.g.ssTap);
      tapBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(); });
      tapBtn.addEventListener('click', tap); // VoiceOver / keyboard activation; duplicates are ignored by the log
      stage.addEventListener('pointerdown', tap);
      const reminder = h('div', { class: 'targets small', 'aria-label': `${S.g.ssIntro} ${names.join(', ')}` }, model.targets.map((t) => shape(t, { size: 26 })));
      ctx.render(h('div', { class: 'round sprint-round' }, reminder, stage, fb, tapBtn));
      const next = () => {
        current += 1;
        if (current >= model.stimuli.length) {
          const t = log.tally();
          ctx.finish({ score: t.score, correct: t.hits, total: t.targets, rows: [[S.g.ssTargets, t.targets], [S.g.ssHits, t.hits], [S.g.ssMisses, t.misses], [S.g.ssFas, t.falseAlarms]] });
          return;
        }
        const st = model.stimuli[current];
        ctx.progress(current, model.stimuli.length);
        clear(stage); stage.className = 'stage sprint'; stage.dataset.index = String(current); stage.dataset.shape = st.shape;
        stage.appendChild(shape(st.shape, { size: 120, label: S.g.shapes[st.shape] }));
        fb.className = 'fb inline'; fb.textContent = '';
        session.after(SS.STIMULUS_MS, () => { clear(stage); stage.dataset.shape = ''; session.after(SS.GAP_MS, next); });
      };
      session.after(500, next);
    });
    ctx.render(h('div', { class: 'round intro' }, h('p', { class: 'question lead' }, S.g.ssIntro),
      h('div', { class: 'targets', dataset: { targets: model.targets.join(',') } }, model.targets.map((t) => h('div', { class: 'target' }, shape(t, { size: 72 }), h('span', {}, S.g.shapes[t])))),
      h('div', { class: 'spacer' }), button({ class: 'btn primary block', dataset: { action: 'start' }, onClick: begin }, S.play.start)));
  },

  memory_stack(ctx) {
    const { S, guard, session } = ctx; const model = MS.generate(ctx.rng); const entry = MS.createEntry();
    const tile = (sym, extra) => h('span', { class: `tile ${extra || ''}`, dataset: { symbol: sym || '' } }, sym ? shape(sym, { size: 30, label: S.g.shapes[sym], color: SHAPE_COLORS[sym] }) : null);
    const recall = () => {
      const slots = h('div', { class: 'tiles answer', role: 'list' });
      const submit = button({ class: 'btn primary block', dataset: { action: 'submit' }, disabled: true }, S.play.validate);
      const draw = () => {
        clear(slots);
        const v = entry.value;
        for (let i = 0; i < MS.LENGTH; i++) slots.appendChild(h('span', { role: 'listitem', class: 'slot', 'aria-label': `${S.g.msSlot(i + 1)}: ${v[i] ? S.g.shapes[v[i]] : S.g.msEmpty}` }, tile(v[i], v[i] ? 'filled' : 'empty')));
        submit.disabled = !entry.full;
      };
      const keys = MS.SYMBOLS.map((sym) => button({ class: 'key', dataset: { symbol: sym }, 'aria-label': S.g.shapes[sym], onClick: guard(() => { if (entry.push(sym)) { ctx.haptic('tap'); draw(); } }) }, shape(sym, { size: 34, color: SHAPE_COLORS[sym] }), h('span', { class: 'key-name' }, S.g.shapes[sym])));
      submit.addEventListener('click', guard(() => {
        if (!entry.full) return;
        const r = MS.score(model.sequence, entry.value);
        const row = (label, list) => h('div', { class: 'review-row' }, h('div', { class: 'eyebrow' }, label), h('div', { class: 'tiles small' }, list.map((sym, i) => tile(sym, sym === model.sequence[i] ? 'good' : 'bad'))));
        ctx.finish({ score: r.score, correct: r.correct, total: r.total, review: h('div', { class: 'review' }, row(S.g.msShown, model.sequence), row(S.g.msYours, entry.value)) });
      }));
      ctx.progress(1, 2, '');
      ctx.render(h('div', { class: 'round memory', dataset: { phase: 'recall' } }, h('p', { class: 'question lead' }, S.g.msRecall), slots,
        h('div', { class: 'keys' }, keys),
        h('div', { class: 'row' }, button({ class: 'btn ghost', dataset: { action: 'backspace' }, onClick: guard(() => { if (entry.backspace()) draw(); }) }, icon('backspace', 20), ' ', S.g.msBack),
          button({ class: 'btn ghost', dataset: { action: 'clear' }, onClick: guard(() => { entry.clear(); draw(); }) }, S.g.msClear)), submit));
      draw(); ctx.announce(`${S.g.msHidden} ${S.g.msRecall}`);
    };
    ctx.progress(0, 2, '');
    ctx.render(h('div', { class: 'round memory', dataset: { phase: 'memorize', sequence: model.sequence.join(',') } }, h('p', { class: 'question lead' }, S.g.msMemorize),
      h('div', { class: 'tiles show', role: 'list' }, model.sequence.map((sym) => h('span', { role: 'listitem' }, tile(sym, 'filled')))),
      h('div', { class: 'countdown' }, h('div', { class: 'countdown-fill', style: { 'animation-duration': `${MS.EXPOSURE_MS}ms` } }))));
    session.after(MS.EXPOSURE_MS, recall); // owned by the session: quitting or replaying cancels it
  },

  reality_rank(ctx) {
    const { S, lang, guard } = ctx; const model = RR.generate(ctx.rng); const item = RR.itemById(model.itemId); const ranking = RR.createRanking(model.display);
    const label = (id) => item.o.find((o) => o.id === id)[lang];
    const rankedBox = h('ol', { class: 'ranked' }); const poolBox = h('div', { class: 'pool' });
    const submit = button({ class: 'btn primary block', dataset: { action: 'submit' }, disabled: true }, S.play.validate);
    const act = (fn) => guard(() => { if (fn()) { ctx.haptic('select'); draw(); } });
    const draw = () => {
      clear(rankedBox); clear(poolBox);
      const ranked = ranking.ranked;
      if (!ranked.length) rankedBox.appendChild(h('li', { class: 'ranked-empty' }, S.g.rrEmpty));
      ranked.forEach((id, i) => rankedBox.appendChild(h('li', { class: 'ranked-item', dataset: { option: id } },
        h('span', { class: 'rank', 'aria-label': S.g.rrRank(i + 1) }, i + 1), h('span', { class: 'ranked-text' }, label(id)),
        h('span', { class: 'ranked-actions' },
          button({ class: 'icon-btn', dataset: { action: 'up' }, 'aria-label': `${S.g.rrUp}: ${label(id)}`, disabled: i === 0, onClick: act(() => ranking.move(id, -1)) }, icon('up', 20)),
          button({ class: 'icon-btn', dataset: { action: 'down' }, 'aria-label': `${S.g.rrDown}: ${label(id)}`, disabled: i === ranked.length - 1, onClick: act(() => ranking.move(id, 1)) }, icon('down', 20)),
          button({ class: 'icon-btn', dataset: { action: 'remove' }, 'aria-label': `${S.g.rrRemove}: ${label(id)}`, onClick: act(() => ranking.remove(id)) }, icon('close', 20))))));
      ranking.pool.forEach((id) => poolBox.appendChild(button({ class: 'opt', dataset: { option: id }, onClick: act(() => ranking.add(id)) }, h('span', { class: 'opt-letter', 'aria-hidden': 'true' }, '+'), h('span', { class: 'opt-text' }, label(id)))));
      poolHead.hidden = ranking.pool.length === 0;
      submit.disabled = !ranking.complete;
      ctx.progress(ranked.length, model.display.length);
    };
    const poolHead = h('div', { class: 'eyebrow' }, S.g.rrPool);
    submit.addEventListener('click', guard(() => {
      if (!ranking.complete) return;
      const mine = ranking.ranked; const r = RR.score(item.id, mine);
      const list = (title, ids, withWhy) => h('div', { class: 'review-row' }, h('div', { class: 'eyebrow' }, title), h('ol', { class: 'review-list' }, ids.map((id) => { const o = item.o.find((x) => x.id === id); return h('li', {}, h('span', {}, o[lang]), withWhy ? h('span', { class: 'why' }, ` — ${o.why[lang]}`) : null); })));
      ctx.finish({ score: r.score, correct: r.concordant, total: r.pairs, countLabel: S.g.rrPairs(r.concordant, r.pairs), review: h('div', { class: 'review' }, list(S.g.rrSuggested, RR.expectedOrder(item.id), true), list(S.g.rrYours, mine, false)) });
    }));
    ctx.render(h('div', { class: 'round rank-round', dataset: { itemId: item.id } },
      h('div', { class: 'card stem' }, h('div', { class: 'eyebrow' }, S.g.rrSituation), h('p', { class: 'premise' }, item.s[lang]), h('div', { class: 'eyebrow gap' }, S.g.clues), h('ul', { class: 'clues' }, item.clues[lang].map((c) => h('li', {}, c)))),
      h('div', { class: 'eyebrow' }, S.g.rrYour), rankedBox, poolHead, poolBox, submit));
    draw();
  },
};

export function mountGame(gameId, ctx) { VIEWS[gameId](ctx); }
