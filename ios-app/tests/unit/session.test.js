import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionManager } from '../../src/core/session.js';
import { fakeEnv } from './helpers.js';

function setup() { const f = fakeEnv(); const commits = []; const stalls = []; const manager = createSessionManager({ env: f.env, onCommit: (s, r) => commits.push({ id: s.id, game: s.gameId, r }), onStall: (s) => stalls.push(s.id) }); return { f, commits, stalls, manager }; }

test('a finished session commits exactly once, even with several end events', () => {
  const { manager, commits, f } = setup(); const s = manager.start('rule_shift');
  s.after(100, () => s.finish({ score: 50 })); s.after(100, () => s.finish({ score: 99 }));
  f.advance(200);
  assert.equal(s.finish({ score: 10 }), false); assert.equal(commits.length, 1); assert.equal(commits[0].r.score, 50); assert.equal(s.state, 'finished'); assert.equal(f.pending, 0);
});

test('an abandoned session with a pending delay commits nothing and its late callbacks are dead', () => {
  const { manager, commits, f } = setup(); const s = manager.start('memory_stack'); let fired = 0;
  s.after(5000, () => { fired += 1; s.finish({ score: 100 }); });
  const lateHandler = s.guard(() => { fired += 1; });
  f.advance(1000); assert.ok(manager.abandon()); f.advance(10000); lateHandler();
  assert.equal(fired, 0); assert.equal(commits.length, 0); assert.equal(s.finish({ score: 100 }), false); assert.equal(manager.current, null); assert.equal(f.pending, 0);
});

test('fast switch A to B: the timers of A cannot touch B and only B can commit', () => {
  const { manager, commits, f } = setup(); const touched = [];
  const a = manager.start('memory_stack'); a.after(80, () => touched.push('a-launch')); a.after(5200, () => touched.push('a-recall'));
  f.advance(20);
  const b = manager.start('symbol_sprint'); b.after(300, () => touched.push('b'));
  assert.equal(a.state, 'abandoned');
  f.advance(6000);
  assert.deepEqual(touched, ['b']); assert.equal(a.finish({ score: 1 }), false); assert.ok(b.finish({ score: 2 })); assert.deepEqual(commits.map((c) => c.game), ['symbol_sprint']);
});

test('replay starts a new session id and the old one stays finished', () => {
  const { manager, commits } = setup(); const a = manager.start('logic_bridge'); a.finish({ score: 80 }); const b = manager.start('logic_bridge');
  assert.notEqual(a.id, b.id); b.finish({ score: 60 }); assert.equal(commits.length, 2); assert.equal(a.finish({ score: 0 }), false);
});

test('pause: hidden time does not count, deadlines resume where they stopped', () => {
  const { manager, f } = setup(); const s = manager.start('symbol_sprint'); const fired = [];
  const h = s.after(850, () => fired.push(f.now));
  f.advance(300); assert.ok(s.pause()); assert.equal(s.remaining(h), 550);
  f.advance(60000); assert.deepEqual(fired, [], 'nothing expires while hidden');
  assert.equal(s.guard(() => 'x')(), undefined, 'input is ignored while paused'); assert.equal(s.finish({ score: 1 }), false, 'cannot finish while paused');
  assert.ok(s.resume()); f.advance(549); assert.deepEqual(fired, []); f.advance(1); assert.deepEqual(fired, [60850]);
  assert.equal(s.pause(), true); assert.equal(s.pause(), false); assert.equal(s.resume(), true); assert.equal(s.resume(), false);
});

test('returning to the foreground does not revive an abandoned game or an expired stimulus', () => {
  const { manager, f, commits } = setup(); const s = manager.start('symbol_sprint'); let shown = 0;
  s.after(850, () => { shown += 1; });
  f.advance(850); assert.equal(shown, 1);
  s.pause(); s.abandon(); assert.equal(s.resume(), false); f.advance(5000); assert.equal(shown, 1); assert.equal(commits.length, 0);
});

test('frozen process without a pause event: the session pauses itself instead of skipping stimuli', () => {
  const { manager, f, stalls } = setup(); const s = manager.start('symbol_sprint'); const fired = [];
  s.after(850, () => fired.push('a')); const later = s.after(2000, () => fired.push('b'));
  f.advance(400); f.freeze(30000); f.advance(0);
  assert.equal(s.state, 'paused'); assert.equal(stalls.length, 1); assert.deepEqual(fired, []); assert.ok(s.remaining(later) >= 1150);
  s.resume(); f.advance(0); assert.deepEqual(fired, ['a']); f.advance(2000); assert.deepEqual(fired, ['a', 'b']);
});

test('cancel removes a timer; timers created after the end are refused', () => {
  const { manager, f } = setup(); const s = manager.start('rule_shift'); let n = 0;
  const h = s.after(100, () => { n += 1; }); s.cancel(h); f.advance(500); assert.equal(n, 0);
  s.finish({ score: 0 }); assert.equal(s.after(10, () => { n += 1; }), 0); f.advance(100); assert.equal(n, 0);
});
