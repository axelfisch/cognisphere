// Deterministic clock + timer queue for session tests.
export function fakeEnv() {
  let now = 0; let seq = 0; const timers = new Map();
  return {
    env: { now: () => now, setTimeout: (fn, ms) => { const id = ++seq; timers.set(id, { fn, at: now + Math.max(0, ms) }); return id; }, clearTimeout: (id) => timers.delete(id) },
    /** Advance active time, firing due timers in order. */
    advance(ms) {
      const end = now + ms;
      for (;;) {
        let next = null;
        for (const [id, t] of timers) if (t.at <= end && (!next || t.at < next.t.at)) next = { id, t };
        if (!next) break;
        now = Math.max(now, next.t.at); timers.delete(next.id); next.t.fn();
      }
      now = end;
    },
    /** Jump the clock without running timers (process frozen), then let overdue timers fire. */
    freeze(ms) { now += ms; },
    get pending() { return timers.size; },
    get now() { return now; },
  };
}
export function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => map.delete(k), map };
}
