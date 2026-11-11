import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitize, applyResult, summarize, emptyData, clearResults, Store, KEY, LEGACY_KEY, LEGACY_LANG_KEY, HISTORY_MAX, SCHEMA } from '../../src/core/storage.js';
import { GAMES } from '../../src/core/catalog.js';
import { memoryStorage } from './helpers.js';

const rec = (data, i, gameId, score, ts = 1700000000000 + i * 1000) => applyResult(data, { sessionId: `s${i}`, gameId, score, correct: 1, total: 2, ts });

test('first result is kept as is, then 60 % old + 40 % new, average over played domains', () => {
  let d = emptyData(); d = rec(d, 1, 'logic_bridge', 80).data; assert.equal(d.domains.reasoning.score, 80);
  d = rec(d, 2, 'logic_bridge', 40).data; assert.equal(d.domains.reasoning.score, 64); assert.equal(d.domains.reasoning.plays, 2); assert.equal(d.domains.reasoning.best, 80);
  d = rec(d, 3, 'rule_shift', 0).data;
  const sum = summarize(d); assert.equal(sum.coverage, 2); assert.equal(sum.average, 32); assert.equal(sum.totalPlays, 3);
  const flex = sum.domains.find((x) => x.domain === 'flex'); assert.equal(flex.played, true); assert.equal(flex.score, 0, 'a played zero is a real 0');
  const mem = sum.domains.find((x) => x.domain === 'memory'); assert.equal(mem.played, false); assert.equal(mem.score, null, 'unplayed is not 0');
  assert.equal(summarize(emptyData()).average, null);
});

test('recording is idempotent on the session id and rejects invalid results', () => {
  let d = emptyData(); const a = rec(d, 1, 'iceberg', 67); assert.ok(a.written); d = a.data;
  const again = rec(d, 1, 'iceberg', 67); assert.equal(again.written, false); assert.equal(again.data, d);
  for (const bad of [{ sessionId: 'x', gameId: 'nope', score: 5 }, { sessionId: 'x', gameId: 'iceberg', score: 101 }, { sessionId: 'x', gameId: 'iceberg', score: NaN }, { sessionId: 5, gameId: 'iceberg', score: 5 }]) assert.equal(applyResult(d, bad).written, false);
  assert.equal(d.sessions.length, 1);
});

test('history is capped at 60 while coverage and play counts keep the older domains', () => {
  let d = emptyData(); d = rec(d, 0, 'memory_stack', 70).data;
  for (let i = 1; i <= 75; i++) d = rec(d, i, 'num_sequence', 60).data;
  assert.equal(d.sessions.length, HISTORY_MAX); assert.ok(!d.sessions.some((s) => s.game === 'memory_stack'), 'the old session left the visible history');
  const sum = summarize(d); assert.equal(sum.coverage, 2); assert.equal(sum.historyCount, 60); assert.equal(sum.totalPlays, 76); assert.equal(d.domains.memory.score, 70); assert.equal(d.domains.sequence.plays, 75);
  const again = sanitize(JSON.parse(JSON.stringify(d))).data; assert.deepEqual(again, d, 'a saved state reloads unchanged');
});

test('invalid storage: bad entries are dropped one by one, valid ones survive', () => {
  for (const junk of [null, 42, 'x', [], { schema: 99 }, { foo: 1 }]) { const { data, report } = sanitize(junk); assert.deepEqual(data, emptyData()); assert.equal(report.usable, false); }
  const raw = { schema: SCHEMA, domains: { reasoning: { score: 72, plays: 3, best: 90 }, speed: { score: 'high' }, hacker: { score: 10 }, memory: { score: 400 }, flex: { score: 0, plays: 1 } },
    sessions: [{ id: 'ok1', game: 'logic_bridge', score: 80, ts: 1700000000000, sv: 2, correct: 4, total: 5 }, { id: 'bad1', game: 'logic_bridge', score: -5, ts: 1700000000000 }, { id: 'bad2', game: '<img onerror=x>', score: 5, ts: 1700000000000 }, 'junk', null, { id: 'ok1', game: 'logic_bridge', score: 80, ts: 1700000000000 }, { id: 'bad3', game: 'rule_shift', score: 50, ts: 'yesterday' }, { id: 'ok2', game: 'rule_shift', score: 0, ts: 1700000100000, correct: 9, total: 8 }],
    prefs: { lang: 'de', theme: 'light', haptics: 'yes', onboarded: true } };
  const { data, report } = sanitize(raw);
  assert.deepEqual(data.sessions.map((s) => s.id), ['ok2', 'ok1']); assert.equal(report.droppedSessions, 6); assert.equal(report.droppedDomains, 3);
  assert.deepEqual(Object.keys(data.domains).sort(), ['flex', 'reasoning']); assert.equal(data.domains.reasoning.score, 72); assert.equal(data.domains.flex.score, 0);
  assert.equal(data.sessions[0].correct, undefined, 'inconsistent counts are not kept'); assert.equal(data.sessions[1].correct, 4);
  assert.deepEqual(data.prefs, { lang: null, theme: 'light', haptics: true, onboarded: true });
});

test('schema update: a web V2 save is migrated according to the fields it really contains', () => {
  const v2 = { scores: { reasoning: 68, speed: 100, flex: 45 }, sessions: [{ apt: 'flex', game: 'Rule Shift', score: 45, ts: 1760000300000 }, { apt: 'reasoning', game: 'Logic Bridge', score: 60, ts: 1760000200000 }, { apt: 'reasoning', game: 'Logic Bridge', score: 80, ts: 1760000100000 }, { apt: 'speed', game: 'Symbol Sprint', score: 100, ts: 1760000000000 }] };
  const { data, report } = sanitize(v2);
  assert.equal(report.from, 2); assert.equal(data.schema, SCHEMA); assert.equal(data.sessions.length, 4);
  assert.deepEqual(data.sessions.map((s) => s.game), ['rule_shift', 'logic_bridge', 'logic_bridge', 'symbol_sprint']); assert.ok(data.sessions.every((s) => s.sv === 1), 'old sessions keep scoring version 1');
  assert.equal(data.domains.reasoning.score, 68, 'the stored smoothed score is kept, not recomputed'); assert.equal(data.domains.reasoning.plays, 2); assert.equal(data.domains.reasoning.best, 80); assert.equal(data.domains.speed.score, 100);
  assert.equal(data.sessions[0].correct, undefined, 'V2 never stored correct/total: nothing is invented');
  const twice = sanitize(JSON.parse(JSON.stringify(data))); assert.deepEqual(twice.data, data, 'migration is idempotent');
  const next = applyResult(data, { sessionId: 'new', gameId: 'symbol_sprint', score: 50, ts: 1770000000000 }).data; assert.equal(next.domains.speed.score, 80); assert.equal(next.sessions[0].sv, 2);
});

test('Store: loads native data first, migrates a legacy key without deleting it, keeps the legacy language', async () => {
  const mirror = memoryStorage({ [LEGACY_KEY]: JSON.stringify({ scores: { memory: 50 }, sessions: [{ apt: 'memory', game: 'Memory Stack', score: 50, ts: 1760000000000 }] }), [LEGACY_LANG_KEY]: 'fr' });
  const native = new Map(); const primary = { get: async (k) => native.get(k) ?? null, set: async (k, v) => { native.set(k, v); } };
  const store = new Store({ primary, mirror }); const report = await store.load();
  assert.equal(report.source, 'legacy'); assert.equal(report.migratedFrom, 2); assert.equal(store.data.domains.memory.score, 50); assert.equal(store.data.prefs.lang, 'fr');
  assert.ok(mirror.getItem(LEGACY_KEY), 'legacy key untouched'); assert.ok(native.get(KEY), 'migrated copy written to the native store'); assert.equal(JSON.parse(native.get(KEY)).schema, SCHEMA);
  const s2 = new Store({ primary, mirror: memoryStorage() }); assert.equal((await s2.load()).source, 'primary'); assert.equal(s2.data.domains.memory.score, 50);
});

test('Store: corrupt JSON is backed up and does not crash; write failures are reported', async () => {
  const mirror = memoryStorage({ [KEY]: '{"schema":3,"sessions":[' });
  const store = new Store({ mirror }); const report = await store.load();
  assert.equal(report.corrupt, true); assert.deepEqual(store.data.sessions, []); assert.ok(mirror.getItem(`${KEY}_corrupt`));
  const states = []; const failing = new Store({ primary: { get: async () => null, set: async () => { throw new Error('disk full'); } }, mirror: { getItem: () => null, setItem: () => { throw new Error('quota'); } }, onSaveState: (s) => states.push(s) });
  await failing.load(); const r = failing.record({ sessionId: 'a', gameId: 'iceberg', score: 33, ts: Date.now() });
  assert.equal(r.written, true); assert.equal(await r.saved, false); assert.deepEqual(states, ['error']); assert.equal(failing.data.sessions.length, 1, 'the result stays available in memory');
  const blocked = new Store({ mirror: { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } } }); await blocked.load(); assert.deepEqual(blocked.data.sessions, []);
});

test('Store: record once, preferences persist, erase keeps preferences and empties results', async () => {
  const mirror = memoryStorage(); const store = new Store({ mirror }); await store.load();
  await store.setPrefs({ lang: 'fr', theme: 'light', haptics: false, onboarded: true });
  assert.equal(store.record({ sessionId: 'x1', gameId: 'pattern_tri', score: 60, ts: Date.now() }).written, true); assert.equal(store.record({ sessionId: 'x1', gameId: 'pattern_tri', score: 60, ts: Date.now() }).written, false);
  const reloaded = new Store({ mirror }); await reloaded.load();
  assert.equal(reloaded.data.sessions.length, 1); assert.deepEqual(reloaded.data.prefs, { lang: 'fr', theme: 'light', haptics: false, onboarded: true });
  await reloaded.clear(); const after = new Store({ mirror }); await after.load();
  assert.deepEqual(after.data.sessions, []); assert.deepEqual(after.data.domains, {}); assert.equal(after.data.prefs.lang, 'fr'); assert.equal(summarize(after.data).coverage, 0);
  assert.deepEqual(clearResults(reloaded.data).prefs, reloaded.data.prefs); assert.equal(GAMES.length, 9);
});
