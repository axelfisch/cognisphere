import { h, button, clear, s } from './dom.js';
import { icon, logo } from './shapes.js';
import { radar } from './radar.js';
import { strings, detectLang, formatDate } from './i18n.js';
import { mountGame } from './play.js';
import { GAMES, gameById } from '../core/catalog.js';
import { Store, summarize } from '../core/storage.js';
import { createSessionManager } from '../core/session.js';
import { createRng, randomSeed } from '../core/rng.js';
import * as bridge from '../native/bridge.js';
import { jsonText, buildPdf, fileName, utf8ToBase64 } from '../export/exporter.js';
import { LICENSES } from './licenses.js';

const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
export const SUPPORT_URL = 'mailto:a.fisch@icloud.com?subject=Cognisphere%20iOS';
/** Public policy URL: set once the page is published (see appstore/). Empty = in-app policy only. */
export const PRIVACY_URL = '';
const DOMAIN_COLORS_LIGHT = { reasoning: '#6d45d9', speed: '#0b7f72', memory: '#8a5a00', pattern: '#0b6a8f', reality: '#b3261e', epistemic: '#7a4fd0', analogy: '#1b7a45', sequence: '#a04a00', flex: '#6b6200' };

export async function boot(root) {
  let saveChipEl = null; // declared first: the store may report its save state during load
  let mirror = null;
  try { mirror = window.localStorage; mirror.getItem('x'); } catch { mirror = null; }
  const store = new Store({ primary: bridge.nativeStore(), mirror, onSaveState: () => refreshSaveChip() });
  await store.load();
  if (!store.data.prefs.lang) store.data.prefs.lang = detectLang(navigator.languages || [navigator.language]);

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ui = { tab: 'home', route: null, historyOpen: false, lastGame: null };
  const prefs = () => store.data.prefs;
  const S = () => strings(prefs().lang);
  const haptic = (kind) => { if (prefs().haptics) bridge.haptic(kind); };
  const colorOf = (game) => (prefs().theme === 'light' ? DOMAIN_COLORS_LIGHT[game.domain] : game.color);

  // ---- static frame -------------------------------------------------------
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const view = h('main', { class: 'view', id: 'view' });
  const tabbar = h('nav', { class: 'tabbar' });
  const overlay = h('div', { class: 'overlay-host' });
  const toastHost = h('div', { class: 'toast-host', role: 'status', 'aria-live': 'polite' });
  root.append(h('div', { class: 'ambient', 'aria-hidden': 'true' }, h('i', {}), h('i', {}), h('i', {})), view, tabbar, overlay, toastHost, live);

  const announce = (text) => { live.textContent = ''; setTimeout(() => { live.textContent = text; }, 60); };
  let toastTimer = null;
  const toast = (text) => { clearTimeout(toastTimer); clear(toastHost); toastHost.appendChild(h('div', { class: 'toast' }, text)); toastTimer = setTimeout(() => clear(toastHost), 2600); };

  function applyChrome() {
    document.documentElement.dataset.theme = prefs().theme;
    document.documentElement.lang = prefs().lang;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', prefs().theme === 'light' ? '#f0f4ff' : '#0e1117');
  }
  function refreshSaveChip() {
    if (!saveChipEl || !saveChipEl.isConnected) return;
    const err = store.saveState === 'error';
    saveChipEl.className = `chip ${err ? 'danger' : 'ok'}`;
    saveChipEl.textContent = err ? `✕ ${S().more.saveError}` : `✓ ${S().more.saved}`;
  }
  const saveChip = () => { saveChipEl = h('span', { class: 'chip ok' }); queueMicrotask(refreshSaveChip); return saveChipEl; };

  // ---- sessions -----------------------------------------------------------
  let lastRecord = null;
  const manager = createSessionManager({
    onCommit: (session, result) => {
      lastRecord = store.record({ sessionId: session.id, gameId: session.gameId, score: result.score, correct: result.correct, total: result.total, ts: Date.now() });
    },
    onStall: () => showPause(),
  });
  bridge.watchLifecycle(() => { if (manager.current && manager.current.active) { manager.pause(); showPause(); } });

  // ---- navigation ---------------------------------------------------------
  function show(node, { tabs = false, dir = 'fade', focus = true } = {}) {
    node.classList.add('screen', `enter-${dir}`);
    clear(view); view.appendChild(node); view.scrollTop = 0;
    document.body.classList.toggle('with-tabs', tabs);
    document.body.classList.toggle('in-game', ui.route === 'play');
    renderTabbar(tabs);
    if (focus) { const head = node.querySelector('h1'); if (head) { head.setAttribute('tabindex', '-1'); head.focus({ preventScroll: true }); } }
  }
  function renderTabbar(visible) {
    clear(tabbar); tabbar.hidden = !visible;
    if (!visible) return;
    tabbar.setAttribute('aria-label', 'Cognisphere');
    for (const id of ['home', 'games', 'profile', 'more']) {
      tabbar.appendChild(button({ class: `tab ${ui.tab === id ? 'active' : ''}`, dataset: { tab: id }, 'aria-current': ui.tab === id ? 'page' : null, onClick: () => { if (ui.tab !== id) { haptic('select'); goTab(id); } } }, icon(id, 24), h('span', {}, S().tabs[id])));
    }
  }
  function goTab(id, dir = 'fade') {
    manager.abandon(); closeOverlay();
    ui.tab = id; ui.route = 'tabs';
    show({ home: homeScreen, games: gamesScreen, profile: profileScreen, more: moreScreen }[id](), { tabs: true, dir });
  }
  const backBar = (onBack) => h('div', { class: 'topbar' }, button({ class: 'back', dataset: { action: 'back' }, onClick: onBack }, icon('back', 22), h('span', {}, S().detail.back)));
  const title = (text) => h('h1', { class: 'title' }, text);
  const eyebrow = (text, color) => h('div', { class: 'eyebrow', style: color ? { color } : null }, text);

  // ---- onboarding ---------------------------------------------------------
  function onboarding(step = 0) {
    ui.route = 'onboarding';
    const st = S().onb; const [t, b] = st.steps[step];
    const done = () => { store.setPrefs({ onboarded: true }); goTab('home', 'up'); };
    show(h('section', { class: 'onb', dataset: { screen: 'onboarding', step: String(step) } },
      h('div', { class: 'onb-dots', role: 'img', 'aria-label': st.step(step + 1) }, [0, 1, 2].map((i) => h('i', { class: i <= step ? 'on' : '' }))),
      h('div', { class: 'onb-logo' }, logo(88)),
      h('h1', { class: 'onb-title' }, t), h('p', { class: 'onb-body' }, b), h('div', { class: 'spacer' }),
      button({ class: 'btn primary block big', dataset: { action: 'next' }, onClick: () => { haptic('tap'); if (step < 2) onboarding(step + 1); else done(); } }, step === 2 ? st.begin : st.cont),
      step < 2 ? button({ class: 'btn text block', dataset: { action: 'skip' }, onClick: done }, st.skip) : h('div', { class: 'btn text block', 'aria-hidden': 'true' }, ' ')), { dir: step ? 'left' : 'fade' });
  }

  // ---- home ---------------------------------------------------------------
  function coverageRing(sum) {
    const size = 132; const c = size / 2; const r = 54; const n = 9; const gap = 0.14;
    const svg = s('svg', { viewBox: `0 0 ${size} ${size}`, width: size, height: size, class: 'ring', 'aria-hidden': 'true' });
    sum.domains.forEach((d, i) => {
      const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / n + gap / 2; const a1 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / n - gap / 2;
      const p = (a) => `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`;
      svg.appendChild(s('path', { d: `M ${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)}`, class: d.played ? 'seg on' : 'seg', style: { 'animation-delay': `${i * 45}ms` } }));
    });
    return h('div', { class: 'ring-wrap' }, svg, h('div', { class: 'ring-num' }, h('strong', {}, String(sum.coverage)), h('span', {}, S().home.of9)));
  }
  function homeScreen() {
    const T = S(); const sum = summarize(store.data);
    const unplayed = GAMES.filter((g) => !store.data.domains[g.domain]);
    const least = sum.domains.filter((d) => d.played).sort((a, b) => a.plays - b.plays || (a.lastTs || 0) - (b.lastTs || 0))[0];
    const suggested = unplayed.length ? unplayed[0] : gameById(least.game);
    return h('section', { dataset: { screen: 'home' } },
      h('header', { class: 'brand' }, logo(40), h('div', { class: 'brand-name' }, 'Cogni', h('span', {}, 'sphere'))),
      h('h1', { class: 'sr-only' }, 'Cognisphere'),
      h('p', { class: 'tagline' }, T.tagline),
      button({ class: 'card hero', dataset: { action: 'coverage' }, 'aria-label': `${T.home.coverLabel(sum.coverage)}. ${sum.coverage ? `${T.home.avg}: ${sum.average}.` : T.home.firstRun}`, onClick: () => goTab('profile') },
        coverageRing(sum),
        h('div', { class: 'hero-text' }, eyebrow(T.home.cover), sum.coverage
          ? h('div', {}, h('div', { class: 'hero-avg' }, h('strong', {}, String(sum.average)), h('span', {}, ' / 100')), h('div', { class: 'muted small' }, T.home.avg), h('div', { class: 'muted small' }, T.home.sessions(sum.totalPlays)))
          : h('div', { class: 'muted' }, T.home.firstRun)), h('span', { class: 'chev' }, icon('chevron', 20))),
      h('h2', { class: 'section' }, T.home.suggested),
      button({ class: 'card suggest', dataset: { action: 'suggested', game: suggested.id }, onClick: () => detail(suggested.id) },
        h('span', { class: 'game-icon', style: { '--c': colorOf(suggested) } }, icon(suggested.id, 26)),
        h('span', { class: 'grow' }, eyebrow(T.domains[suggested.domain], colorOf(suggested)), h('span', { class: 'card-title' }, T.names[suggested.id]), h('span', { class: 'muted small block' }, T.how[suggested.id])),
        h('span', { class: 'play-fab', 'aria-hidden': 'true' }, icon('play', 20))),
      h('div', { class: 'row two' },
        button({ class: 'btn secondary', dataset: { action: 'browse' }, onClick: () => goTab('games') }, T.home.browse),
        button({ class: 'btn secondary', dataset: { action: 'guide' }, onClick: () => guide() }, T.home.guide)),
      h('p', { class: 'note' }, T.home.note));
  }

  // ---- games --------------------------------------------------------------
  function gameRow(g, i, onOpen) {
    const T = S(); const d = store.data.domains[g.domain];
    return button({ class: 'card game-row', dataset: { game: g.id }, style: { 'animation-delay': `${i * 35}ms` }, onClick: onOpen },
      h('span', { class: 'game-icon', style: { '--c': colorOf(g) } }, icon(g.id, 24)),
      h('span', { class: 'grow' }, eyebrow(T.domains[g.domain], colorOf(g)), h('span', { class: 'card-title' }, T.names[g.id])),
      h('span', { class: 'game-meta' }, d ? [h('strong', {}, String(d.score)), h('span', { class: 'muted small' }, T.games.plays(d.plays))] : h('span', { class: 'muted small' }, T.games.notPlayed)),
      h('span', { class: 'chev' }, icon('chevron', 18)));
  }
  function gamesScreen() {
    const T = S();
    return h('section', { dataset: { screen: 'games' } }, title(T.games.title), h('p', { class: 'sub' }, T.games.sub),
      h('div', { class: 'stack' }, GAMES.map((g, i) => gameRow(g, i, () => detail(g.id)))));
  }
  function guide() {
    ui.route = 'guide'; const T = S();
    show(h('section', { dataset: { screen: 'guide' } }, backBar(() => goTab(ui.tab, 'right')), title(T.guide.title), h('p', { class: 'sub' }, T.guide.sub),
      h('div', { class: 'stack' }, GAMES.map((g) => h('article', { class: 'card guide-card', dataset: { game: g.id } },
        h('div', { class: 'guide-head' }, h('span', { class: 'game-icon', style: { '--c': colorOf(g) } }, icon(g.id, 22)), h('div', { class: 'grow' }, eyebrow(T.domains[g.domain], colorOf(g)), h('h2', { class: 'card-title' }, T.names[g.id]))),
        h('p', { class: 'muted' }, T.how[g.id]), h('p', { class: 'muted small' }, h('strong', {}, `${T.detail.scoring}${prefs().lang === 'fr' ? ' : ' : ': '}`), T.scoring[g.id]),
        button({ class: 'btn secondary small', dataset: { action: 'open', game: g.id }, onClick: () => detail(g.id, 'guide') }, T.detail.play))))), { dir: 'left' });
  }
  function detail(gameId, from = 'tab') {
    manager.abandon(); closeOverlay();
    ui.route = 'detail'; ui.detailFrom = from;
    const T = S(); const g = gameById(gameId); const d = store.data.domains[g.domain];
    const back = () => (from === 'guide' ? guide() : goTab(ui.tab, 'right'));
    show(h('section', { class: 'detail', dataset: { screen: 'detail', game: g.id } }, backBar(back),
      h('div', { class: 'detail-icon game-icon big', style: { '--c': colorOf(g) } }, icon(g.id, 40)),
      eyebrow(T.domains[g.domain], colorOf(g)), title(T.names[g.id]),
      h('div', { class: 'chips' }, h('span', { class: 'chip' }, T.games.about(g.seconds)), h('span', { class: 'chip', dataset: { role: 'domain-score' } }, d ? `${T.detail.last} ${d.score}` : T.games.notPlayed), d && d.best !== undefined ? h('span', { class: 'chip' }, `${T.games.best} ${d.best}`) : null),
      h('h2', { class: 'section' }, T.detail.how), h('p', { class: 'lead-text' }, T.how[g.id]),
      h('h2', { class: 'section' }, T.detail.scoring), h('p', { class: 'muted' }, T.scoring[g.id]),
      h('div', { class: 'spacer' }),
      button({ class: 'btn primary block big', dataset: { action: 'play' }, onClick: () => { haptic('tap'); startGame(g.id); } }, icon('play', 18), ' ', T.detail.play)), { dir: 'left' });
  }

  // ---- play ---------------------------------------------------------------
  function startGame(gameId) {
    closeOverlay();
    const g = gameById(gameId); const T = S(); const lang = prefs().lang;
    const session = manager.start(gameId); // abandons any previous session: its timers and handlers are dead
    ui.route = 'play'; ui.lastGame = gameId; lastRecord = null;
    const fill = h('div', { class: 'progress-fill' }); const counter = h('div', { class: 'counter', 'aria-hidden': 'true' });
    const host = h('div', { class: 'game-host' });
    const screen = h('section', { class: 'play', dataset: { screen: 'play', game: g.id, session: session.id } },
      h('div', { class: 'playbar' }, button({ class: 'quit', dataset: { action: 'quit' }, onClick: () => askQuit(session, g.id) }, T.play.quit),
        h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100' }, fill), counter),
      eyebrow(T.domains[g.domain], colorOf(g)), h('h1', { class: 'play-title' }, T.names[g.id]), host);
    session.onPauseChange((paused) => screen.classList.toggle('paused', paused));
    const ctx = {
      session, S: T, lang, rng: createRng(randomSeed()), reducedMotion,
      guard: (fn) => session.guard(fn),
      haptic, announce: (t) => { if (session.alive) announce(t); },
      render: (node) => { if (!session.alive) return; clear(host); node.classList.add('round-enter'); host.appendChild(node); },
      progress: (done, total, label) => { if (!session.alive) return; const p = Math.round((done / total) * 100); fill.style.width = `${p}%`; fill.parentElement.setAttribute('aria-valuenow', String(p)); counter.textContent = label !== undefined ? label : `${Math.min(done + 1, total)}/${total}`; },
      finish: (result) => { if (session.finish(result)) resultScreen(g, result, lastRecord); },
    };
    show(screen, { dir: 'up' });
    mountGame(g.id, ctx);
  }
  function dialog({ titleText, body, actions, id }) {
    clear(overlay);
    const box = h('div', { class: 'dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-label': titleText, dataset: { dialog: id } }, h('h2', {}, titleText), body ? h('p', {}, body) : null, h('div', { class: 'row two' }, actions));
    overlay.appendChild(h('div', { class: 'scrim' }, box)); overlay.classList.add('open');
    view.setAttribute('aria-hidden', 'true'); view.inert = true;
    const first = box.querySelector('button'); if (first) first.focus({ preventScroll: true });
  }
  function closeOverlay() { clear(overlay); overlay.classList.remove('open'); view.removeAttribute('aria-hidden'); view.inert = false; }
  function leaveGame(session, gameId) { session.abandon(); closeOverlay(); detail(gameId, ui.detailFrom || 'tab'); }
  function askQuit(session, gameId) {
    if (!session.alive) return;
    const wasActive = session.pause(); const T = S();
    dialog({ id: 'quit', titleText: T.play.quitQ, body: T.play.quitB, actions: [
      button({ class: 'btn secondary', dataset: { action: 'cancel' }, onClick: () => { closeOverlay(); if (wasActive || session.state === 'paused') session.resume(); } }, T.play.quitNo),
      button({ class: 'btn danger', dataset: { action: 'confirm' }, onClick: () => leaveGame(session, gameId) }, T.play.quitYes)] });
  }
  function showPause() {
    const session = manager.current; if (!session) return;
    const T = S();
    dialog({ id: 'pause', titleText: T.play.paused, body: T.play.pausedB, actions: [
      button({ class: 'btn secondary', dataset: { action: 'quit' }, onClick: () => leaveGame(session, session.gameId) }, T.play.quit),
      button({ class: 'btn primary', dataset: { action: 'resume' }, onClick: () => { closeOverlay(); session.resume(); } }, T.play.resume)] });
  }

  // ---- result -------------------------------------------------------------
  function resultScreen(g, result, record) {
    ui.route = 'result'; const T = S(); const d = store.data.domains[g.domain];
    const num = h('div', { class: 'score', dataset: { score: String(result.score) }, 'aria-label': `${result.score} ${T.result.outOf}` }, reducedMotion ? String(result.score) : '0');
    const status = h('p', { class: 'chip ok', dataset: { role: 'save-status' } }, `✓ ${T.result.saved}`);
    const fail = () => { status.className = 'chip danger'; status.textContent = `✕ ${T.result.saveError}`; };
    if (!record || !record.written) fail(); else record.saved.then((ok) => { if (!ok) fail(); });
    show(h('section', { class: 'result', dataset: { screen: 'result', game: g.id } },
      eyebrow(T.domains[g.domain], colorOf(g)), h('h1', { class: 'result-title' }, T.result.title),
      h('div', { class: 'score-wrap' }, h('div', { class: 'eyebrow' }, T.result.perf), num, h('div', { class: 'muted' }, T.result.outOf)),
      h('p', { class: 'result-count' }, result.countLabel || T.result.okn(result.correct, result.total)),
      result.rows ? h('dl', { class: 'rows' }, result.rows.map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, String(v))))) : null,
      result.review || null,
      h('p', { class: 'note center' }, `${T.result.note} ${d ? T.result.domainNow(d.score) : ''}`), status,
      h('div', { class: 'spacer' }),
      button({ class: 'btn primary block big', dataset: { action: 'replay' }, onClick: () => { haptic('tap'); startGame(g.id); } }, T.result.replay),
      h('div', { class: 'row two' }, button({ class: 'btn secondary', dataset: { action: 'games' }, onClick: () => goTab('games') }, T.result.toGames), button({ class: 'btn secondary', dataset: { action: 'profile' }, onClick: () => goTab('profile') }, T.result.toProfile))), { dir: 'up' });
    haptic(result.score >= 50 ? 'success' : 'tap'); announce(T.result.announce(result.score));
    if (!reducedMotion) { const t0 = performance.now(); const tick = (now) => { if (!num.isConnected) return; const k = Math.min(1, (now - t0) / 700); num.textContent = String(Math.round(result.score * (1 - (1 - k) ** 3))); if (k < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
  }

  // ---- profile ------------------------------------------------------------
  function profileScreen() {
    const T = S(); const sum = summarize(store.data); const lang = prefs().lang;
    const rowsText = sum.domains.map((d) => `${T.domains[d.domain]}: ${d.played ? d.score : T.profile.notPlayed}`).join('. ');
    const sessions = store.data.sessions; const visible = ui.historyOpen ? sessions : sessions.slice(0, 8);
    const busy = { on: false };
    const exportBtn = (kind, label) => button({ class: 'btn secondary', dataset: { action: `export-${kind}` }, onClick: (e) => doExport(kind, e.currentTarget, busy) }, icon('share', 18), ' ', label);
    return h('section', { dataset: { screen: 'profile' } }, title(T.profile.title),
      h('div', { class: 'card center avg-card' }, eyebrow(T.profile.avg), h('div', { class: 'avg', dataset: { role: 'average' } }, sum.average === null ? '—' : String(sum.average)),
        h('div', { class: 'muted small', dataset: { role: 'basis' } }, sum.coverage ? T.profile.basis(sum.coverage, sum.totalPlays) : T.profile.empty),
        sum.coverage ? null : button({ class: 'btn primary', dataset: { action: 'choose' }, onClick: () => goTab('games') }, T.profile.emptyCta)),
      h('div', { class: 'card' }, h('h2', { class: 'card-h' }, T.profile.radar), h('div', { class: 'radar-wrap' }, radar(sum.domains, { label: T.profile.radarAlt(rowsText) })),
        h('h2', { class: 'card-h' }, T.profile.domains),
        h('ol', { class: 'domains' }, sum.domains.map((d) => { const g = gameById(d.game); return h('li', { dataset: { domain: d.domain, played: String(d.played) } },
          h('div', { class: 'domain-line' }, h('span', { class: 'domain-name' }, T.domains[d.domain]), d.played ? h('span', { class: 'domain-score', style: { color: colorOf(g) } }, h('strong', {}, String(d.score)), h('span', { class: 'muted small' }, ` · ${T.profile.sessionsN(d.plays)}`)) : h('span', { class: 'muted small', dataset: { role: 'not-played' } }, T.profile.notPlayed)),
          h('div', { class: 'bar' }, h('div', { class: 'bar-fill', style: { width: `${d.played ? d.score : 0}%`, background: colorOf(g) } }))); })),
        h('p', { class: 'muted small' }, T.profile.scoreInfo)),
      h('div', { class: 'card' }, h('h2', { class: 'card-h' }, T.profile.history),
        sessions.length ? h('ul', { class: 'history', dataset: { count: String(sessions.length) } }, visible.map((x) => h('li', { dataset: { session: x.id } }, h('span', { class: 'grow' }, T.names[x.game]), h('span', { class: 'muted small' }, formatDate(x.ts, lang, { day: 'numeric', month: 'short' })), h('strong', { class: 'history-score' }, String(x.score))))) : h('p', { class: 'muted', dataset: { role: 'history-empty' } }, T.profile.historyEmpty),
        sessions.length > 8 ? button({ class: 'btn text', dataset: { action: 'history-toggle' }, onClick: () => { ui.historyOpen = !ui.historyOpen; const y = view.scrollTop; goTab('profile'); view.scrollTop = y; } }, ui.historyOpen ? T.profile.showLess : T.profile.showAll(sessions.length)) : null,
        h('p', { class: 'muted small' }, T.profile.historyNote)),
      h('div', { class: 'card' }, h('h2', { class: 'card-h' }, T.profile.exportT), h('div', { class: 'row two' }, exportBtn('json', T.profile.exJson), exportBtn('pdf', T.profile.exPdf)), h('div', { class: 'chip-line' }, saveChip())));
  }
  async function doExport(kind, btn, busy) {
    if (busy.on) return; busy.on = true; btn.disabled = true; btn.classList.add('loading');
    const T = S(); const lang = prefs().lang; const now = Date.now();
    try {
      let base64;
      if (kind === 'json') base64 = utf8ToBase64(jsonText(store.data, lang, now, APP_VERSION));
      else { const { jsPDF } = await import('jspdf'); base64 = buildPdf(jsPDF, store.data, lang, now).output('datauristring').split(',')[1]; }
      const outcome = await bridge.shareFile({ name: fileName(kind, lang, now), base64, title: T.exp.shareTitle });
      document.documentElement.dataset.lastExport = `${kind}:${outcome}`;
      if (outcome !== 'cancelled') { haptic('success'); toast(T.profile.exportDone); }
    } catch (err) { document.documentElement.dataset.lastExport = `${kind}:error`; toast(T.profile.exportFail); } finally { busy.on = false; if (btn.isConnected) { btn.disabled = false; btn.classList.remove('loading'); } }
  }

  // ---- more ---------------------------------------------------------------
  function segmented(name, options, value, onPick) {
    return h('div', { class: 'seg', role: 'group', 'aria-label': name }, options.map(([val, label]) => button({ class: val === value ? 'on' : '', 'aria-pressed': String(val === value), dataset: { value: String(val) }, onClick: () => { if (val !== value) onPick(val); } }, label)));
  }
  function moreScreen() {
    const T = S(); const p = prefs();
    const set = (patch) => { store.setPrefs(patch); applyChrome(); haptic('select'); const y = view.scrollTop; goTab('more'); view.scrollTop = y; };
    const link = (label, action, onClick) => button({ class: 'list-row', dataset: { action }, onClick }, h('span', {}, label), icon('chevron', 18));
    return h('section', { dataset: { screen: 'more' } }, title(T.more.title),
      h('div', { class: 'card list' },
        h('div', { class: 'list-row', dataset: { setting: 'lang' } }, h('span', {}, T.more.lang), segmented(T.more.lang, [['en', 'EN'], ['fr', 'FR']], p.lang, (v) => set({ lang: v }))),
        h('div', { class: 'list-row', dataset: { setting: 'theme' } }, h('span', {}, T.more.appear), segmented(T.more.appear, [['dark', T.more.dark], ['light', T.more.light]], p.theme, (v) => set({ theme: v }))),
        h('div', { class: 'list-row', dataset: { setting: 'haptics' } }, h('span', {}, T.more.haptics), segmented(T.more.haptics, [[true, T.more.on], [false, T.more.off]], p.haptics, (v) => { set({ haptics: v }); if (v) bridge.haptic('success'); }))),
      h('div', { class: 'card list' }, link(T.more.guide, 'guide', () => guide()), link(T.more.intro, 'intro', () => onboarding(0))),
      h('div', { class: 'card' }, h('h2', { class: 'card-h' }, T.more.privacy), h('p', { class: 'muted' }, T.more.privacyB), h('div', { class: 'chip-line' }, saveChip())),
      h('div', { class: 'card list' }, link(T.more.privacyLink, 'policy', () => policy()), link(T.more.support, 'support', () => bridge.openExternal(SUPPORT_URL)), link(T.more.licenses, 'licenses', () => licenses())),
      h('div', { class: 'card' }, h('h2', { class: 'card-h' }, T.more.about), h('p', { class: 'muted' }, T.more.aboutB), h('p', { class: 'muted small' }, `${T.more.version} ${APP_VERSION} · © Axel Fisch 2026`)),
      button({ class: 'btn danger block', dataset: { action: 'reset' }, onClick: () => dialog({ id: 'reset', titleText: T.more.resetQ, body: T.more.resetB, actions: [
        button({ class: 'btn secondary', dataset: { action: 'cancel' }, onClick: closeOverlay }, T.more.cancel),
        button({ class: 'btn danger solid', dataset: { action: 'confirm' }, onClick: () => { store.clear(); ui.historyOpen = false; closeOverlay(); haptic('warning'); goTab('more'); toast(T.more.erased); announce(T.more.erased); } }, T.more.erase)] }) }, T.more.reset));
  }
  function textPage(id, heading, blocks, extra) {
    ui.route = id;
    show(h('section', { class: 'text-page', dataset: { screen: id } }, backBar(() => goTab('more', 'right')), title(heading), blocks, extra || null), { dir: 'left' });
  }
  function policy() {
    const P = S().policy;
    textPage('policy', P.title, [h('p', { class: 'muted small' }, P.updated), P.body.map(([t, b]) => h('div', { class: 'block' }, h('h2', { class: 'section' }, t), h('p', { class: 'muted' }, b)))],
      PRIVACY_URL ? button({ class: 'btn secondary block', dataset: { action: 'policy-online' }, onClick: () => bridge.openExternal(PRIVACY_URL) }, PRIVACY_URL.replace('https://', '')) : null);
  }
  function licenses() {
    textPage('licenses', S().more.licenses, LICENSES.map((l) => h('div', { class: 'block' }, h('h2', { class: 'section' }, `${l.name} ${l.version}`), h('p', { class: 'muted small' }, `${l.license} — ${l.holder}`))));
  }

  // ---- start --------------------------------------------------------------
  applyChrome();
  if (prefs().onboarded) goTab('home'); else onboarding(0);
  document.documentElement.dataset.ready = 'true';
  return { store, manager };
}
