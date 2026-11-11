// Local, account-less persistence. Pure data functions first, then a store with pluggable backends.
import { GAMES, DOMAIN_IDS, gameById, gameByDomain, gameByLegacyName } from './catalog.js';

export const SCHEMA = 3;
/** 1 = web V2 formulas. 2 = iOS 1.0 formulas (Symbol Sprint and Reality Rank changed, see docs/SCORING.md). */
export const SCORING_VERSION = 2;
export const HISTORY_MAX = 60;
export const SMOOTH_OLD = 0.6;
export const SMOOTH_NEW = 0.4;
export const KEY = 'cognisphere_ios_v3';
export const LEGACY_KEY = 'cognisphere_v2';
export const LEGACY_LANG_KEY = 'cog_lang';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isScore = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;
const isTs = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0 && v < 4102444800000; // < year 2100
const clampInt = (v, min, max) => Math.min(max, Math.max(min, Math.round(v)));

export function defaultPrefs() {
  return { lang: null, theme: 'dark', haptics: true, onboarded: false };
}

export function emptyData() {
  return { schema: SCHEMA, scoringVersion: SCORING_VERSION, domains: {}, sessions: [], prefs: defaultPrefs() };
}

function sanitizePrefs(raw) {
  const prefs = defaultPrefs();
  if (!isObj(raw)) return prefs;
  if (raw.lang === 'fr' || raw.lang === 'en') prefs.lang = raw.lang;
  if (raw.theme === 'dark' || raw.theme === 'light') prefs.theme = raw.theme;
  if (typeof raw.haptics === 'boolean') prefs.haptics = raw.haptics;
  if (typeof raw.onboarded === 'boolean') prefs.onboarded = raw.onboarded;
  return prefs;
}

function sanitizeSession(raw, index) {
  if (!isObj(raw)) return null;
  const game = gameById(raw.game) || gameByLegacyName(raw.game) || gameByDomain(raw.domain) || gameByDomain(raw.apt);
  if (!game) return null;
  if (!isScore(raw.score) || !isTs(raw.ts)) return null;
  const out = {
    id: typeof raw.id === 'string' && raw.id.length <= 80 ? raw.id : `legacy-${raw.ts}-${index}`,
    game: game.id,
    domain: game.domain,
    score: clampInt(raw.score, 0, 100),
    ts: Math.round(raw.ts),
    sv: raw.sv === 2 ? 2 : 1,
  };
  if (Number.isInteger(raw.correct) && Number.isInteger(raw.total) && raw.total > 0 && raw.correct >= 0 && raw.correct <= raw.total) {
    out.correct = raw.correct;
    out.total = raw.total;
  }
  return out;
}

/**
 * Validate anything read from disk. Invalid entries are dropped one by one; valid ones are kept.
 * Accepts the iOS schema (3) and the web V2 shape ({scores:{domain:n}, sessions:[{apt,game,score,ts}]}).
 */
export function sanitize(raw) {
  const report = { from: null, droppedSessions: 0, droppedDomains: 0, usable: false };
  const data = emptyData();
  if (!isObj(raw)) return { data, report };
  const isV2 = raw.schema === undefined && (isObj(raw.scores) || Array.isArray(raw.sessions));
  report.from = isV2 ? 2 : raw.schema === SCHEMA ? SCHEMA : null;
  if (report.from === null) return { data, report };
  report.usable = true;

  const seen = new Set();
  const rawSessions = Array.isArray(raw.sessions) ? raw.sessions : [];
  rawSessions.forEach((entry, index) => {
    const s = sanitizeSession(entry, index);
    if (!s || seen.has(s.id)) { report.droppedSessions += 1; return; }
    seen.add(s.id);
    data.sessions.push(s);
  });
  data.sessions.sort((a, b) => b.ts - a.ts);
  if (data.sessions.length > HISTORY_MAX) data.sessions.length = HISTORY_MAX;

  const playsInHistory = {};
  for (const s of data.sessions) playsInHistory[s.domain] = (playsInHistory[s.domain] || 0) + 1;

  const rawDomains = isV2 ? raw.scores : raw.domains;
  if (isObj(rawDomains)) {
    for (const [key, value] of Object.entries(rawDomains)) {
      if (!DOMAIN_IDS.includes(key)) { report.droppedDomains += 1; continue; }
      const score = isV2 ? value : isObj(value) ? value.score : undefined;
      if (!isScore(score)) { report.droppedDomains += 1; continue; }
      const inHistory = playsInHistory[key] || 0;
      const storedPlays = !isV2 && Number.isInteger(value.plays) && value.plays > 0 ? value.plays : 0;
      const entry = { score: clampInt(score, 0, 100), plays: Math.max(1, storedPlays, inHistory) };
      const bestInHistory = data.sessions.filter((s) => s.domain === key).reduce((m, s) => Math.max(m, s.score), -1);
      const storedBest = !isV2 && isScore(value.best) ? clampInt(value.best, 0, 100) : -1;
      const best = Math.max(storedBest, bestInHistory);
      if (best >= 0) entry.best = best;
      const lastTs = data.sessions.find((s) => s.domain === key)?.ts ?? (!isV2 && isTs(value.lastTs) ? value.lastTs : undefined);
      if (lastTs) entry.lastTs = lastTs;
      data.domains[key] = entry;
    }
  }
  // Sessions whose domain summary is missing or invalid: rebuild the summary from what history actually holds.
  for (const domain of Object.keys(playsInHistory)) {
    if (data.domains[domain]) continue;
    const list = data.sessions.filter((s) => s.domain === domain).slice().reverse(); // oldest first
    let score;
    for (const s of list) score = score === undefined ? s.score : Math.round(score * SMOOTH_OLD + s.score * SMOOTH_NEW);
    data.domains[domain] = { score, plays: list.length, best: Math.max(...list.map((s) => s.score)), lastTs: list[list.length - 1].ts };
  }
  data.prefs = sanitizePrefs(raw.prefs);
  return { data, report };
}

/**
 * Record one finished session (pure, returns new data). Idempotent on session id.
 * Domain score: first result as is, then 60 % previous + 40 % new, rounded.
 */
export function applyResult(data, result) {
  const game = gameById(result.gameId);
  if (!game || !isScore(result.score) || typeof result.sessionId !== 'string') return { data, written: false };
  if (data.sessions.some((s) => s.id === result.sessionId)) return { data, written: false };
  const score = clampInt(result.score, 0, 100);
  const ts = isTs(result.ts) ? Math.round(result.ts) : Date.now();
  const previous = data.domains[game.domain];
  const entry = {
    score: previous ? Math.round(previous.score * SMOOTH_OLD + score * SMOOTH_NEW) : score,
    plays: (previous ? previous.plays : 0) + 1,
    best: Math.max(previous && previous.best !== undefined ? previous.best : -1, score),
    lastTs: ts,
  };
  const session = { id: result.sessionId, game: game.id, domain: game.domain, score, ts, sv: SCORING_VERSION };
  if (Number.isInteger(result.correct) && Number.isInteger(result.total) && result.total > 0) {
    session.correct = result.correct;
    session.total = result.total;
  }
  const next = {
    ...data,
    domains: { ...data.domains, [game.domain]: entry },
    sessions: [session, ...data.sessions].slice(0, HISTORY_MAX),
  };
  return { data: next, written: true, session };
}

/** Derived figures. Coverage counts domains ever played, even if their sessions left the visible history. */
export function summarize(data) {
  const played = GAMES.filter((g) => data.domains[g.domain]);
  const coverage = played.length;
  const average = coverage ? Math.round(played.reduce((sum, g) => sum + data.domains[g.domain].score, 0) / coverage) : null;
  const totalPlays = played.reduce((sum, g) => sum + data.domains[g.domain].plays, 0);
  return {
    coverage,
    average,
    totalPlays,
    historyCount: data.sessions.length,
    domains: GAMES.map((g) => {
      const d = data.domains[g.domain];
      return { domain: g.domain, game: g.id, played: !!d, score: d ? d.score : null, plays: d ? d.plays : 0, best: d && d.best !== undefined ? d.best : null, lastTs: d ? d.lastTs ?? null : null };
    }),
  };
}

export function clearResults(data) {
  return { ...emptyData(), prefs: { ...data.prefs } };
}

/**
 * Store: memory state + durable backends.
 * `primary` is async (native Preferences on iOS), `mirror` is a synchronous localStorage-like object (may be null).
 */
export class Store {
  constructor({ primary = null, mirror = null, onChange = null, onSaveState = null } = {}) {
    this.primary = primary;
    this.mirror = mirror;
    this.data = emptyData();
    this.saveState = 'idle'; // idle | saved | error
    this.loadReport = null;
    this.onChange = onChange;
    this.onSaveState = onSaveState;
    this._queue = Promise.resolve();
  }

  _readMirror(key) {
    try { return this.mirror ? this.mirror.getItem(key) : null; } catch { return null; }
  }

  async _readPrimary(key) {
    try { return this.primary ? await this.primary.get(key) : null; } catch { return null; }
  }

  async load() {
    const report = { source: 'empty', migratedFrom: null, droppedSessions: 0, droppedDomains: 0, corrupt: false };
    const candidates = [
      ['primary', await this._readPrimary(KEY)],
      ['mirror', this._readMirror(KEY)],
      ['legacy', this._readMirror(LEGACY_KEY)],
    ];
    for (const [source, text] of candidates) {
      if (typeof text !== 'string' || !text) continue;
      let parsed;
      try { parsed = JSON.parse(text); } catch { report.corrupt = true; this._backup(text); continue; }
      const { data, report: r } = sanitize(parsed);
      if (!r.usable) { report.corrupt = true; this._backup(text); continue; }
      this.data = data;
      report.source = source;
      report.migratedFrom = r.from !== SCHEMA ? r.from : null;
      report.droppedSessions = r.droppedSessions;
      report.droppedDomains = r.droppedDomains;
      break;
    }
    if (report.source === 'legacy' || this.data.prefs.lang === null) {
      const legacyLang = this._readMirror(LEGACY_LANG_KEY);
      if ((legacyLang === 'fr' || legacyLang === 'en') && this.data.prefs.lang === null) this.data.prefs.lang = legacyLang;
    }
    this.loadReport = report;
    // Persist migrations/repairs under the current key; the legacy key is left untouched (non-destructive).
    if (report.source !== 'empty' && (report.source !== 'primary' || report.migratedFrom || report.droppedSessions || report.droppedDomains)) {
      await this.save();
    }
    return report;
  }

  _backup(text) {
    try { if (this.mirror && !this.mirror.getItem(`${KEY}_corrupt`)) this.mirror.setItem(`${KEY}_corrupt`, text.slice(0, 200000)); } catch { /* best effort */ }
  }

  _setSaveState(state) {
    if (this.saveState === state) return;
    this.saveState = state;
    if (this.onSaveState) this.onSaveState(state);
  }

  /** Write the current state. Resolves to true if at least one durable backend accepted it. */
  save() {
    const text = JSON.stringify(this.data);
    let mirrorOk = false;
    try { if (this.mirror) { this.mirror.setItem(KEY, text); mirrorOk = true; } } catch { mirrorOk = false; }
    this._queue = this._queue.then(async () => {
      let primaryOk = false;
      try { if (this.primary) { await this.primary.set(KEY, text); primaryOk = true; } } catch { primaryOk = false; }
      const ok = primaryOk || mirrorOk;
      this._setSaveState(ok ? 'saved' : 'error');
      return ok;
    });
    return this._queue;
  }

  record(result) {
    const { data, written, session } = applyResult(this.data, result);
    if (!written) return { written: false };
    this.data = data;
    const saved = this.save();
    if (this.onChange) this.onChange();
    return { written: true, session, saved };
  }

  setPrefs(patch) {
    this.data = { ...this.data, prefs: sanitizePrefs({ ...this.data.prefs, ...patch }) };
    const saved = this.save();
    if (this.onChange) this.onChange();
    return saved;
  }

  clear() {
    this.data = clearResults(this.data);
    const saved = this.save();
    if (this.onChange) this.onChange();
    return saved;
  }
}
