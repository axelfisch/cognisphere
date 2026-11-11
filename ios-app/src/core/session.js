// One active game session at a time. The session owns every timer and callback of a game:
// - timers use deadlines measured on a monotonic clock and can be paused (hidden time never counts);
// - leaving, replaying or launching another game invalidates the old session: late events are no-ops;
// - an abandoned session commits nothing, a finished session commits exactly once (idempotent).

const STALL_MS = 1500; // a timer firing this late means the process was frozen without a pause event

let counter = 0;
function makeId(now) {
  counter += 1;
  const rand = Math.floor(Math.random() * 0xffffff).toString(36);
  return `s${Date.now().toString(36)}-${counter.toString(36)}-${rand}`;
}

export class GameSession {
  constructor(gameId, env, onCommit, onStall) {
    this.id = makeId();
    this.gameId = gameId;
    this.state = 'active'; // active | paused | finished | abandoned
    this._env = env;
    this._onCommit = onCommit;
    this._onStall = onStall;
    this._timers = new Map();
    this._seq = 0;
    this._pauseListeners = [];
    this.result = null;
  }

  get alive() { return this.state === 'active' || this.state === 'paused'; }
  get active() { return this.state === 'active'; }

  /** Run fn after `ms` of *active* time. Returns a handle for cancel(). */
  after(ms, fn) {
    if (!this.alive) return 0;
    const handle = ++this._seq;
    const timer = { fn, remaining: Math.max(0, ms), startedAt: 0, native: null };
    this._timers.set(handle, timer);
    if (this.state === 'active') this._arm(handle, timer);
    return handle;
  }

  cancel(handle) {
    const timer = this._timers.get(handle);
    if (!timer) return;
    if (timer.native != null) this._env.clearTimeout(timer.native);
    this._timers.delete(handle);
  }

  /** Remaining active milliseconds for a pending timer (0 if unknown). */
  remaining(handle) {
    const timer = this._timers.get(handle);
    if (!timer) return 0;
    if (this.state !== 'active') return timer.remaining;
    return Math.max(0, timer.remaining - (this._env.now() - timer.startedAt));
  }

  /** Wrap a UI callback so it does nothing once the session is over or while it is paused. */
  guard(fn) {
    return (...args) => { if (this.state === 'active') return fn(...args); return undefined; };
  }

  onPauseChange(listener) { this._pauseListeners.push(listener); }

  pause(elapsedOverride) {
    if (this.state !== 'active') return false;
    const now = this._env.now();
    for (const timer of this._timers.values()) {
      if (timer.native != null) this._env.clearTimeout(timer.native);
      timer.native = null;
      const elapsed = elapsedOverride != null ? elapsedOverride : now - timer.startedAt;
      timer.remaining = Math.max(0, timer.remaining - Math.max(0, elapsed));
    }
    this.state = 'paused';
    this._pauseListeners.forEach((l) => l(true));
    return true;
  }

  resume() {
    if (this.state !== 'paused') return false;
    this.state = 'active';
    for (const [handle, timer] of this._timers) this._arm(handle, timer);
    this._pauseListeners.forEach((l) => l(false));
    return true;
  }

  /** Complete the session. Only the first call on an active session commits. */
  finish(result) {
    if (this.state !== 'active') return false;
    this.state = 'finished';
    this._clearAll();
    this.result = result;
    this._onCommit(this, result);
    return true;
  }

  /** Leave without saving anything. */
  abandon() {
    if (!this.alive) return false;
    this.state = 'abandoned';
    this._clearAll();
    return true;
  }

  _clearAll() {
    for (const timer of this._timers.values()) {
      if (timer.native != null) this._env.clearTimeout(timer.native);
    }
    this._timers.clear();
  }

  _arm(handle, timer) {
    timer.startedAt = this._env.now();
    timer.native = this._env.setTimeout(() => this._fire(handle), timer.remaining);
  }

  _fire(handle) {
    const timer = this._timers.get(handle);
    if (!timer || this.state !== 'active') return;
    const elapsed = this._env.now() - timer.startedAt;
    if (elapsed + 1 < timer.remaining) { // fired early: re-arm for what is left
      timer.remaining -= Math.max(0, elapsed);
      this._arm(handle, timer);
      return;
    }
    if (elapsed > timer.remaining + STALL_MS) {
      // The app was frozen without a lifecycle event: treat the frozen time as a pause.
      const counted = timer.remaining;
      this.pause(counted);
      if (this._onStall) this._onStall(this);
      return;
    }
    this._timers.delete(handle);
    timer.fn();
  }
}

export function createSessionManager({ env, onCommit, onStall } = {}) {
  const realEnv = env || {
    now: () => performance.now(),
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
  };
  let current = null;
  const committed = new Set();
  const manager = {
    get current() { return current && current.alive ? current : null; },
    /** Start a session; any previous live session is abandoned (zero writes). */
    start(gameId) {
      if (current && current.alive) current.abandon();
      current = new GameSession(gameId, realEnv, (session, result) => {
        if (committed.has(session.id)) return;
        committed.add(session.id);
        if (onCommit) onCommit(session, result);
      }, onStall);
      return current;
    },
    abandon() { if (current && current.alive) { current.abandon(); return true; } return false; },
    pause() { return current ? current.pause() : false; },
    resume() { return current ? current.resume() : false; },
  };
  return manager;
}
