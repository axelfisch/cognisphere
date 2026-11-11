// End-to-end checks on the built bundle (www/) in headless Chromium with iPhone-sized viewports.
// Writes docs/results/e2e-results.json. This validates the web layer; native iOS behaviour needs Xcode (see docs/VALIDATION.md).
import { createRequire } from 'node:module';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { serve } from '../../scripts/serve.mjs';
import { play, readData, sessionsOf, KEY } from './player.mjs';
import { strings } from '../../src/ui/i18n.js';
import { GAMES } from '../../src/core/catalog.js';

const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'docs/results'); await mkdir(path.join(outDir, 'exports'), { recursive: true });
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;

const results = []; const matrix = [];
async function check(name, fn) {
  if (only && !only.some((o) => name.includes(o))) return;
  const t0 = Date.now();
  try { const detail = await fn(); results.push({ name, status: 'passed', ms: Date.now() - t0, detail: detail || undefined }); console.log(`ok   ${name}`); }
  catch (err) { results.push({ name, status: 'failed', ms: Date.now() - t0, error: String(err && err.message ? err.message : err).split('\n')[0] }); console.log(`FAIL ${name}\n     ${err && err.message}`); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const { server, url } = await serve(0);
const browser = await chromium.launch();
const DEVICES = { compact: { width: 375, height: 667 }, large: { width: 430, height: 932 } };

async function open({ device = 'compact', locale = 'fr-FR', storage = null, reducedMotion = 'no-preference', init = null } = {}) {
  const context = await browser.newContext({ viewport: DEVICES[device], deviceScaleFactor: 1, locale, hasTouch: true, isMobile: true, reducedMotion, acceptDownloads: true });
  const page = await context.newPage(); const log = { errors: [], external: [], requests: 0 };
  page.on('console', (m) => { if (m.type() === 'error') log.errors.push(m.text()); });
  page.on('pageerror', (e) => log.errors.push(`pageerror: ${e.message}`));
  await context.route('**/*', (route) => { const u = route.request().url(); log.requests += 1; if (u.startsWith(url) || u.startsWith('blob:') || u.startsWith('data:')) return route.continue(); log.external.push(u); return route.abort(); });
  if (storage) await context.addInitScript((entries) => { if (!sessionStorage.getItem('__seeded')) { for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, v); sessionStorage.setItem('__seeded', '1'); } }, storage);
  if (init) await context.addInitScript(init);
  await page.goto(url); await page.waitForSelector('html[data-ready]');
  return { context, page, log };
}
const onboarded = (prefs = {}) => ({ [KEY]: JSON.stringify({ schema: 3, scoringVersion: 2, domains: {}, sessions: [], prefs: { lang: 'fr', theme: 'dark', haptics: true, onboarded: true, ...prefs } }) });
const tab = async (page, id) => { if (!(await page.isVisible(`.tabbar [data-tab=${id}]`))) { await page.reload(); await page.waitForSelector('html[data-ready]'); } await page.click(`.tabbar [data-tab=${id}]`); }; // a reload recovers from a failed scenario
async function openGame(page, gameId) { await tab(page, 'games'); await page.click(`[data-screen=games] [data-game=${gameId}]`); await page.waitForSelector(`[data-screen=detail][data-game=${gameId}]`); await page.click('[data-action=play]'); await page.waitForSelector(`[data-screen=play][data-game=${gameId}]`); }
async function resultScore(page) { await page.waitForSelector('[data-screen=result]', { timeout: 60000 }); return Number(await page.getAttribute('.score', 'data-score')); }
async function quit(page) { await page.click('[data-action=quit]'); await page.waitForSelector('[data-dialog=quit]'); await page.click('[data-dialog=quit] [data-action=confirm]'); await page.waitForSelector('[data-screen=detail]'); }
const noErrors = (log) => assert(log.errors.length === 0 && log.external.length === 0, `console errors ${JSON.stringify(log.errors)} external ${JSON.stringify(log.external)}`);

// ---------------------------------------------------------------------------------------------------------
await check('first launch offline: onboarding, no external request, FR from device locale', async () => {
  const { context, page, log } = await open({ locale: 'fr-FR' });
  assert(await page.$('[data-screen=onboarding][data-step="0"]'), 'onboarding not shown on first launch');
  assert((await page.textContent('.onb-title')) === strings('fr').onb.steps[0][0], 'onboarding not in French');
  await page.click('[data-action=next]'); await page.click('[data-action=next]'); await page.waitForSelector('[data-step="2"]'); await page.click('[data-action=next]');
  await page.waitForSelector('[data-screen=home]'); assert((await page.textContent('.ring-num strong')) === '0', 'coverage should be 0');
  assert((await readData(page)).prefs.onboarded === true, 'onboarding flag not saved');
  for (const t of ['games', 'profile', 'more', 'home']) { await tab(page, t); await page.waitForSelector(`[data-screen=${t}]`); }
  assert((await page.$$('[data-screen=home] [data-action]')).length >= 4, 'home actions missing');
  await page.click('[data-action=guide]'); await page.waitForSelector('[data-screen=guide]'); assert((await page.$$('.guide-card')).length === 9, 'guide must list nine games');
  await page.click('[data-action=back]'); await page.waitForSelector('[data-screen=home]');
  await page.click('[data-action=suggested]'); await page.waitForSelector('[data-screen=detail][data-game=logic_bridge]'); await page.click('[data-action=back]');
  await page.click('[data-action=coverage]'); await page.waitForSelector('[data-screen=profile]');
  await page.reload(); await page.waitForSelector('[data-screen=home]'); // onboarding is not shown again
  noErrors(log); const n = log.requests; await context.close(); return { requests: n, external: 0 };
});

await check('EN device locale starts in English; skip works', async () => {
  const { context, page, log } = await open({ locale: 'en-US', device: 'large' });
  assert((await page.textContent('[data-action=skip]')) === 'Skip', 'not English'); await page.click('[data-action=skip]'); await page.waitForSelector('[data-screen=home]');
  assert((await page.textContent('.tab.active span')) === 'Home', 'tab label'); noErrors(log); await context.close();
});

// Nine complete games per language. FR: compact iPhone, dark theme. EN: large iPhone, light theme.
const PLANS = {
  fr: { logic_bridge: {}, symbol_sprint: { mode: 'perfect' }, memory_stack: {}, pattern_tri: {}, reality_rank: { order: 'exact' }, iceberg: {}, verbal_analogy: {}, num_sequence: {}, rule_shift: {} },
  en: { logic_bridge: { wrong: 1 }, symbol_sprint: { mode: 'mixed' }, memory_stack: { wrong: 2 }, pattern_tri: { wrong: 2 }, reality_rank: { order: 'swap' }, iceberg: { wrong: 1 }, verbal_analogy: { wrong: 3 }, num_sequence: { wrong: 5 }, rule_shift: { wrong: 3 } },
};
for (const [lang, device, theme] of [['fr', 'compact', 'dark'], ['en', 'large', 'light']]) {
  const { context, page, log } = await open({ device, storage: onboarded({ lang, theme }) });
  const S = strings(lang);
  for (const game of GAMES) {
    await check(`${lang.toUpperCase()} ${theme} ${device} · ${game.id}: complete game, controlled score, single save, replay`, async () => {
      const before = (await sessionsOf(page)).length;
      await openGame(page, game.id);
      assert((await page.textContent('.play-title')) === S.names[game.id], 'title not localised');
      assert((await page.getAttribute('html', 'data-theme')) === theme, 'theme');
      const expected = await play(page, game.id, { ...PLANS[lang][game.id], lang });
      const shown = await resultScore(page);
      assert(shown === expected.score, `score on screen ${shown}, expected ${expected.score}`);
      assert((await page.textContent('.result-title')) === S.result.title, 'result not localised');
      await page.waitForFunction(() => document.querySelector('[data-role=save-status]').textContent.includes('✓'));
      let sessions = await sessionsOf(page);
      assert(sessions.length === before + 1, `expected exactly one new session, got ${sessions.length - before}`);
      assert(sessions[0].game === game.id && sessions[0].score === expected.score && sessions[0].sv === 2, 'saved session differs from the result');
      if (expected.rows) { const rows = await page.$$eval('.rows dd', (els) => els.map((e) => Number(e.textContent))); assert(JSON.stringify(rows) === JSON.stringify(expected.rows), `sprint counts ${rows} vs ${expected.rows}`); }
      // replay → fresh session, then explicit quit → nothing more is saved
      await page.click('[data-action=replay]'); await page.waitForSelector(`[data-screen=play][data-game=${game.id}]`);
      const fresh = await page.evaluate(() => ({ counter: document.querySelector('.counter').textContent, w: document.querySelector('.progress-fill').style.width }));
      assert(fresh.w === '0%' || fresh.w === '', `replay did not reset progress (${fresh.w})`);
      await page.click('[data-action=quit]'); await page.waitForSelector('[data-dialog=quit]'); await page.click('[data-dialog=quit] [data-action=cancel]');
      assert(await page.$(`[data-screen=play][data-game=${game.id}]`), 'cancel should stay in the game');
      await quit(page);
      sessions = await sessionsOf(page); assert(sessions.length === before + 1, 'abandoned replay wrote a result');
      const chip = await page.textContent('[data-role=domain-score]'); assert(/\d/.test(chip), 'detail screen does not show the domain score');
      matrix.push({ game: game.id, lang, device, theme, plan: PLANS[lang][game.id], expected: expected.score, shown, saved: sessions[0].score, newSessions: 1, afterReplay: 'fresh session, quit → 0 write' });
      return { score: shown };
    });
  }
  await check(`${lang.toUpperCase()} result buttons: Games and Profile work after a game (Reality Rank path)`, async () => {
    await openGame(page, 'reality_rank'); await play(page, 'reality_rank', { order: 'reverse', lang }); assert((await resultScore(page)) === 0, 'reverse order should score 0');
    assert((await page.$$('.review-list li')).length === 8, 'review with suggested and own order missing');
    await page.click('[data-action=games]'); await page.waitForSelector('[data-screen=games]');
    await openGame(page, 'reality_rank'); await play(page, 'reality_rank', { order: 'exact', lang }); await resultScore(page);
    await page.click('[data-action=profile]'); await page.waitForSelector('[data-screen=profile]');
  });
  await check(`${lang.toUpperCase()} profile: all nine played, zero is shown as 0, history and coverage`, async () => {
    await tab(page, 'profile'); const data = await readData(page);
    const rows = await page.$$eval('.domains li', (els) => els.map((e) => ({ d: e.dataset.domain, played: e.dataset.played, text: e.textContent })));
    assert(rows.length === 9 && rows.every((r) => r.played === 'true'), 'nine played domains expected');
    for (const r of rows) assert(r.text.includes(String(data.domains[r.d].score)), `domain ${r.d} score not shown`);
    if (lang === 'en') { assert(data.sessions.some((s) => s.game === 'num_sequence' && s.score === 0), 'zero session'); assert(data.domains.sequence.score === 0 && rows.find((r) => r.d === 'sequence').text.includes('0 ·'), 'a game played at zero must show 0'); }
    assert((await page.getAttribute('.history', 'data-count')) === String(data.sessions.length), 'history count');
    assert((await page.textContent('[data-role=basis]')).includes('9'), 'coverage basis'); assert((await page.getAttribute('.radar', 'aria-label')).length > 60, 'radar text alternative');
    await page.click('[data-action=history-toggle]'); assert((await page.$$('.history li')).length === data.sessions.length, 'full history');
    await tab(page, 'home'); assert((await page.textContent('.ring-num strong')) === '9', 'home coverage 9');
  });
  await check(`${lang.toUpperCase()} exports: real JSON and PDF files with localised content`, async () => {
    await tab(page, 'profile'); const data = await readData(page); const out = {};
    for (const kind of ['json', 'pdf']) {
      const [download] = await Promise.all([page.waitForEvent('download'), page.click(`[data-action=export-${kind}]`)]);
      const name = download.suggestedFilename(); assert(new RegExp(`^${S.exp.filePrefix}-\\d{4}-\\d{2}-\\d{2}\\.${kind}$`).test(name), `file name ${name}`);
      const file = path.join(outDir, 'exports', `${lang}-${name.replace(/\d{4}-\d{2}-\d{2}/, 'sample')}`); await download.saveAs(file); out[kind] = path.basename(file);
      if (kind === 'json') { const j = JSON.parse(await readFile(file, 'utf8')); assert(j.exportVersion === 1 && j.language === lang && j.sessions.length === data.sessions.length && j.summary.domainsPlayed === 9, 'JSON content'); assert(j.domains.every((d) => d.label === S.domains[d.id]), 'JSON labels'); }
      else { assert((await readFile(file)).subarray(0, 5).toString() === '%PDF-', 'not a PDF'); const text = execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' }); assert(text.includes(lang === 'fr' ? 'résultats de jeu' : 'game results') && text.includes(lang === 'fr' ? 'Cognisphere est un jeu' : 'Cognisphere is a game'), 'PDF text'); assert((text.match(/\/ 100$/gm) || []).length === data.sessions.length + 1, 'PDF history rows'); }
    }
    return out;
  });
  await check(`${lang.toUpperCase()} persistence after relaunch: scores, language, theme`, async () => {
    const before = await readData(page); await page.reload(); await page.waitForSelector('[data-screen=home]');
    assert(JSON.stringify(await readData(page)) === JSON.stringify(before), 'data changed across relaunch');
    assert((await page.getAttribute('html', 'lang')) === lang && (await page.getAttribute('html', 'data-theme')) === theme, 'language/theme lost');
    assert((await page.textContent('.tab.active span')) === S.tabs.home, 'labels not in saved language');
  });
  await check(`${lang.toUpperCase()} erase: Cancel keeps everything, Erase empties scores, chart and history`, async () => {
    await tab(page, 'more'); const n = (await sessionsOf(page)).length; assert(n >= 11, 'sessions expected');
    await page.click('[data-action=reset]'); await page.click('[data-dialog=reset] [data-action=cancel]'); assert((await sessionsOf(page)).length === n, 'cancel erased data');
    await page.click('[data-action=reset]'); await page.click('[data-dialog=reset] [data-action=confirm]');
    const d = await readData(page); assert(d.sessions.length === 0 && Object.keys(d.domains).length === 0, 'data not erased'); assert(d.prefs.lang === lang && d.prefs.theme === theme, 'preferences must survive');
    await tab(page, 'profile'); assert((await page.textContent('[data-role=average]')) === '—', 'average not reset'); assert(await page.$('[data-role=history-empty]'), 'history not empty');
    assert((await page.$$('[data-role=not-played]')).length === 9 && (await page.textContent('[data-role=not-played]')) === S.profile.notPlayed, 'unplayed label'); assert((await page.$$('.radar-dot.hollow')).length === 9, 'radar not reset');
    await tab(page, 'home'); assert((await page.textContent('.ring-num strong')) === '0', 'home not reset');
  });
  await check(`${lang.toUpperCase()} console clean and zero external request during the whole run`, async () => { noErrors(log); return { requests: log.requests }; });
  await context.close();
}

// ---------------------------------------------------------------------------------------------------------
await check('Symbol Sprint: no response scores 0 with 12 missed targets; a single hit scores 8', async () => {
  const { context, page } = await open({ storage: onboarded() });
  await openGame(page, 'symbol_sprint'); let r = await play(page, 'symbol_sprint', { mode: 'none' }); assert((await resultScore(page)) === 0 && r.score === 0, 'no response must be 0');
  assert(JSON.stringify(await page.$$eval('.rows dd', (e) => e.map((x) => Number(x.textContent)))) === '[12,0,12,0]', 'tallies');
  await page.click('[data-action=replay]'); r = await play(page, 'symbol_sprint', { mode: 'one' }); assert((await resultScore(page)) === 8, 'one hit among 12 targets must be 8');
  const s = await sessionsOf(page); assert(s.length === 2 && s[0].score === 8 && s[1].score === 0, 'two sessions saved'); await context.close();
});

await check('abandon with a pending delay, then fast A→B: Memory Stack timer cannot touch Rule Shift, zero write', async () => {
  const { context, page, log } = await open({ storage: onboarded() });
  await openGame(page, 'memory_stack'); await page.waitForTimeout(800); await quit(page);
  await page.click('[data-action=back]'); await page.click('[data-screen=games] [data-game=rule_shift]'); await page.click('[data-action=play]'); await page.waitForSelector('.round.shift[data-item-index="0"]');
  await page.waitForTimeout(5600); // the 5 s exposure of the abandoned game would have fired by now
  assert(await page.$('.round.shift[data-item-index="0"]'), 'Rule Shift screen was replaced'); assert(!(await page.$('[data-phase=recall]')), 'old Memory Stack recall appeared');
  assert((await sessionsOf(page)).length === 0, 'abandoned session wrote a result');
  // direct replay chain: start game, immediately leave by a tab-level route (back to detail → games)
  await quit(page); await page.click('[data-action=back]'); await page.waitForSelector('[data-screen=games]'); await page.waitForTimeout(1200);
  assert((await sessionsOf(page)).length === 0, 'write after leaving'); noErrors(log); await context.close();
});

await check('background/foreground: timed game pauses, hidden time does not count, resume is explicit; quit from pause saves nothing', async () => {
  const { context, page } = await open({ storage: onboarded() });
  const hide = () => page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  const showAgain = () => page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
  await openGame(page, 'symbol_sprint'); await page.click('[data-action=start]'); await page.waitForSelector('.stage.sprint[data-index="2"]');
  await hide(); await page.waitForSelector('[data-dialog=pause]');
  const idx = await page.getAttribute('.stage.sprint', 'data-index'); await page.waitForTimeout(3500); await showAgain(); await page.waitForTimeout(600);
  assert((await page.getAttribute('.stage.sprint', 'data-index')) === idx, 'stimuli advanced while hidden'); assert(await page.$('[data-dialog=pause]'), 'game resumed without the player');
  await page.dispatchEvent('[data-action=tap]', 'pointerdown'); // input ignored while paused
  await page.click('[data-dialog=pause] [data-action=resume]'); await page.waitForSelector(`.stage.sprint[data-index="${Number(idx) + 2}"]`, { timeout: 4000 });
  await hide(); await page.waitForSelector('[data-dialog=pause]'); await page.click('[data-dialog=pause] [data-action=quit]'); await page.waitForSelector('[data-screen=detail]'); await showAgain(); await page.waitForTimeout(1500);
  assert(await page.$('[data-screen=detail]'), 'a quit game came back'); assert((await sessionsOf(page)).length === 0, 'paused+quit game wrote a result');
  // Memory Stack: exposure countdown is frozen during the pause
  await page.click('[data-action=back]'); await page.click('[data-screen=games] [data-game=memory_stack]'); await page.click('[data-action=play]'); await page.waitForSelector('[data-phase=memorize]'); await page.waitForTimeout(1000); await hide(); await page.waitForSelector('[data-dialog=pause]'); await page.waitForTimeout(6000);
  assert(await page.$('[data-phase=memorize]'), 'exposure ended while hidden'); await showAgain(); await page.click('[data-dialog=pause] [data-action=resume]');
  const t0 = Date.now(); await page.waitForSelector('[data-phase=recall]', { timeout: 6000 }); const rest = Date.now() - t0; assert(rest > 3200 && rest < 4800, `remaining exposure ${rest} ms, expected about 4000`);
  await context.close(); return { remainingExposureMs: rest };
});

await check('process killed mid-game: relaunch is coherent, finished games stay, the interrupted one is not saved', async () => {
  const { context, page } = await open({ storage: onboarded() });
  await openGame(page, 'rule_shift'); await play(page, 'rule_shift', { lang: 'fr' }); await resultScore(page);
  await page.click('[data-action=replay]'); await page.waitForSelector('.round.shift'); await page.click('[data-answer=yes]');
  await page.reload(); await page.waitForSelector('[data-screen=home]');
  const s = await sessionsOf(page); assert(s.length === 1 && s[0].score === 100, 'history after relaunch'); assert((await page.textContent('.ring-num strong')) === '1', 'coverage after relaunch'); await context.close();
});

await check('invalid storage at launch: corrupt JSON and malformed entries do not crash, valid entries are kept', async () => {
  let o = await open({ storage: { [KEY]: '{"schema":3,"sessions":[{' } }); assert(await o.page.$('[data-screen=onboarding]'), 'app did not start on corrupt data'); assert(o.log.errors.length === 0, 'errors'); await o.context.close();
  const mixed = { schema: 3, domains: { memory: { score: 67, plays: 1 }, speed: { score: 'x' } }, sessions: [{ id: 'k1', game: 'memory_stack', score: 67, ts: 1760000000000, sv: 2 }, { id: 'k2', game: '<b>x</b>', score: 3, ts: 1 }, null], prefs: { lang: 'en', theme: 'light', onboarded: true } };
  o = await open({ storage: { [KEY]: JSON.stringify(mixed) } }); await tab(o.page, 'profile');
  assert((await o.page.$$('.history li')).length === 1 && (await o.page.textContent('[data-role=average]')) === '67', 'valid entries lost'); assert(!(await o.page.content()).includes('<b>x</b>'), 'stored string injected as HTML'); assert(o.log.errors.length === 0, 'errors'); await o.context.close();
});

await check('schema update: a web V2 save (cognisphere_v2 + cog_lang) is migrated without deleting the old key', async () => {
  const v2 = { scores: { reasoning: 68, flex: 45 }, sessions: [{ apt: 'flex', game: 'Rule Shift', score: 45, ts: 1760000300000 }, { apt: 'reasoning', game: 'Logic Bridge', score: 60, ts: 1760000200000 }, { apt: 'reasoning', game: 'Logic Bridge', score: 80, ts: 1760000100000 }] };
  const { context, page, log } = await open({ locale: 'en-US', storage: { cognisphere_v2: JSON.stringify(v2), cog_lang: 'fr' } });
  assert((await page.getAttribute('html', 'lang')) === 'fr', 'legacy language not kept'); await page.click('[data-action=skip]'); await tab(page, 'profile');
  assert((await page.textContent('[data-role=average]')) === '57', 'migrated average'); assert((await page.$$('.history li')).length === 3, 'migrated history');
  const d = await readData(page); assert(d.schema === 3 && d.sessions.every((s) => s.sv === 1) && d.domains.reasoning.plays === 2, 'migrated shape'); assert(await page.evaluate(() => !!localStorage.getItem('cognisphere_v2')), 'legacy key removed');
  assert(log.errors.length === 0, 'errors'); await context.close();
});

await check('storage blocked (writes throw): the game still completes and the result screen reports the failed save', async () => {
  const { context, page } = await open({ storage: onboarded(), init: () => { const real = Storage.prototype.setItem; let armed = false; window.__blockWrites = () => { armed = true; }; Storage.prototype.setItem = function (k, v) { if (armed) throw new DOMException('QuotaExceededError'); return real.call(this, k, v); }; } });
  await page.evaluate(() => window.__blockWrites()); await openGame(page, 'rule_shift'); await play(page, 'rule_shift', { lang: 'fr' }); assert((await resultScore(page)) === 100, 'score');
  await page.waitForFunction(() => document.querySelector('[data-role=save-status]').textContent.includes('✕')); assert((await page.textContent('[data-role=save-status]')).includes(strings('fr').result.saveError), 'save error text');
  await page.click('[data-action=profile]'); assert((await page.textContent('.chip.danger')).includes(strings('fr').more.saveError), 'profile save-state chip'); await context.close();
});

await check('settings: language, theme and haptics switch live and persist; guide and policy reachable; long history capped at 60', async () => {
  const sessions = Array.from({ length: 60 }, (_, i) => ({ id: `h${i}`, game: GAMES[i % 9].id, score: (i * 7) % 101, ts: 1760000000000 - i * 3600000, sv: 2 }));
  const seed = JSON.parse(onboarded()[KEY]); seed.sessions = sessions; GAMES.forEach((g, i) => { seed.domains[g.domain] = { score: 50 + i, plays: 7 }; });
  const { context, page, log } = await open({ storage: { [KEY]: JSON.stringify(seed) } });
  await tab(page, 'more'); await page.click('[data-setting=lang] [data-value=en]'); assert((await page.textContent('.title')) === 'More', 'language switch');
  await page.click('[data-setting=theme] [data-value=light]'); assert((await page.getAttribute('html', 'data-theme')) === 'light', 'theme switch'); await page.click('[data-setting=haptics] [data-value=false]');
  await page.reload(); await page.waitForSelector('[data-screen=home]'); const p = (await readData(page)).prefs; assert(p.lang === 'en' && p.theme === 'light' && p.haptics === false, 'preferences lost after relaunch');
  await tab(page, 'more'); await page.click('[data-action=policy]'); await page.waitForSelector('[data-screen=policy]'); assert((await page.textContent('.title')) === 'Privacy policy', 'policy'); await page.click('[data-action=back]');
  await page.click('[data-action=licenses]'); await page.waitForSelector('[data-screen=licenses]'); await page.click('[data-action=back]');
  await page.click('[data-action=guide]'); await page.waitForSelector('[data-screen=guide]'); await page.click('.guide-card[data-game=iceberg] [data-action=open]'); await page.waitForSelector('[data-screen=detail][data-game=iceberg]'); await page.click('[data-action=back]'); await page.waitForSelector('[data-screen=guide]'); await page.click('[data-action=back]');
  await page.click('[data-action=intro]'); await page.waitForSelector('[data-screen=onboarding]'); await page.click('[data-action=skip]');
  await tab(page, 'profile'); await page.click('[data-action=history-toggle]'); assert((await page.$$('.history li')).length === 60, 'history of 60');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('[data-action=export-pdf]')]); const f = path.join(outDir, 'exports', 'en-long-history.pdf'); await download.saveAs(f);
  const pages = Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [f], { encoding: 'utf8' }))[1]); assert(pages >= 2, 'long PDF should be paginated');
  noErrors(log); await context.close(); return { pdfPages: pages };
});

await check('layout: large text, both sizes and themes — no horizontal overflow, targets at least 44×44', async () => {
  const report = [];
  for (const [device, theme, fontPx] of [['compact', 'dark', 23], ['compact', 'light', 16], ['large', 'dark', 28]]) {
    const { context, page } = await open({ device, storage: onboarded({ theme }) });
    await page.evaluate((px) => { document.documentElement.style.fontSize = `${px}px`; }, fontPx); // same effect as a larger Dynamic Type size
    const audit = async (label) => {
      await page.waitForTimeout(450);
      const r = await page.evaluate(() => { const v = document.getElementById('view'); const small = []; for (const b of document.querySelectorAll('button')) { const q = b.getBoundingClientRect(); if (q.width === 0 || b.closest('[hidden]')) continue; if (q.width < 43.5 || q.height < 43.5) small.push(`${b.className || b.dataset.action}:${Math.round(q.width)}x${Math.round(q.height)}`); } return { overflow: v.scrollWidth - v.clientWidth, body: document.documentElement.scrollWidth - innerWidth, small }; });
      report.push({ device, theme, fontPx, label, ...r }); assert(r.overflow <= 1 && r.body <= 1, `${label} overflows horizontally by ${r.overflow}/${r.body}px at ${fontPx}px`); assert(r.small.length === 0, `${label}: targets under 44pt: ${r.small.join(', ')}`);
    };
    await audit('home'); for (const t of ['games', 'profile', 'more']) { await tab(page, t); await audit(t); }
    for (const g of ['reality_rank', 'memory_stack', 'pattern_tri', 'verbal_analogy', 'rule_shift']) {
      await tab(page, 'games'); await page.click(`[data-game=${g}]`); await audit(`detail ${g}`); await page.click('[data-action=play]');
      if (g === 'memory_stack') await page.waitForSelector('[data-phase=recall]', { timeout: 9000 });
      if (g === 'reality_rank') { for (const id of ['a', 'b', 'c', 'd']) await page.click(`.pool .opt[data-option=${id}]`); }
      await audit(`play ${g}`); await quit(page); await page.click('[data-action=back]');
    }
    await context.close();
  }
  return { screensAudited: report.length };
});

await check('reduced motion: the app runs, a game completes and animations are neutralised', async () => {
  const { context, page, log } = await open({ storage: onboarded(), reducedMotion: 'reduce' });
  const dur = await page.$eval('.screen', (e) => getComputedStyle(e).animationDuration); assert(parseFloat(dur) < 0.01, `screen animation ${dur}`);
  assert((await page.$eval('.ambient i', (e) => getComputedStyle(e).animationName)) === 'none', 'ambient animation still running');
  await openGame(page, 'num_sequence'); await play(page, 'num_sequence', {}); assert((await resultScore(page)) === 100, 'score'); assert((await page.textContent('.score')) === '100', 'no count-up under reduced motion'); noErrors(log); await context.close();
});

await check('accessibility structure: one h1 per screen, labelled controls, live regions, lang attribute', async () => {
  const { context, page } = await open({ storage: onboarded() });
  const audit = async (label) => { const r = await page.evaluate(() => ({ h1: document.querySelectorAll('#view h1').length, unnamed: [...document.querySelectorAll('button')].filter((b) => !(b.textContent.trim() || b.getAttribute('aria-label'))).length, svgNoAlt: [...document.querySelectorAll('#view svg')].filter((s) => !(s.getAttribute('aria-hidden') === 'true' || s.getAttribute('aria-label') || s.closest('[aria-label],[aria-hidden=true]'))).length })); assert(r.h1 === 1, `${label}: ${r.h1} h1`); assert(r.unnamed === 0, `${label}: unnamed buttons`); assert(r.svgNoAlt === 0, `${label}: ${r.svgNoAlt} unlabeled graphics`); };
  await audit('home'); for (const t of ['games', 'profile', 'more']) { await tab(page, t); await audit(t); }
  for (const g of GAMES) { await tab(page, 'games'); await page.click(`[data-game=${g.id}]`); await audit(`detail ${g.id}`); await page.click('[data-action=play]'); await page.waitForTimeout(250); await audit(`play ${g.id}`); await quit(page); await page.click('[data-action=back]'); }
  assert(await page.$('[aria-live=polite]'), 'live region'); assert((await page.getAttribute('html', 'lang')) === 'fr', 'lang'); await context.close();
});

// Native bridge exercised against a simulated Capacitor iOS runtime (the real plugins need a device or simulator).
const fakeNative = () => {
  const calls = []; const prefs = {}; window.__native = { calls, prefs, shareMode: 'ok' };
  const methods = (names) => names.map((name) => ({ name, rtype: 'promise' }));
  window.webkit = { messageHandlers: { bridge: { postMessage() {} } } };
  window.Capacitor = { PluginHeaders: [{ name: 'Preferences', methods: methods(['get', 'set', 'remove']) }, { name: 'Filesystem', methods: methods(['writeFile', 'deleteFile']) }, { name: 'Share', methods: methods(['share']) }, { name: 'Haptics', methods: methods(['impact', 'notification', 'selectionChanged']) }, { name: 'App', methods: methods(['addListener', 'removeAllListeners']) }],
    nativePromise(plugin, method, opts) {
      calls.push({ plugin, method, opts: plugin === 'Filesystem' && method === 'writeFile' ? { ...opts, data: `${opts.data.slice(0, 12)}…(${opts.data.length})` } : opts });
      if (plugin === 'Preferences' && method === 'get') return Promise.resolve({ value: prefs[opts.key] ?? null });
      if (plugin === 'Preferences' && method === 'set') { prefs[opts.key] = opts.value; return Promise.resolve(); }
      if (plugin === 'Filesystem' && method === 'writeFile') return Promise.resolve({ uri: `file:///cache/${opts.path}` });
      if (plugin === 'Share') return window.__native.shareMode === 'cancel' ? Promise.reject(new Error('Share canceled')) : window.__native.shareMode === 'fail' ? Promise.reject(new Error('boom')) : Promise.resolve({ activityType: 'com.apple.DocumentManagerUICore.SaveToFiles' });
      return Promise.resolve({});
    }, nativeCallback() {} };
};
await check('native bridge (simulated iOS runtime): Preferences storage, haptics, file written → shared → deleted, cancel is a normal exit', async () => {
  const { context, page, log } = await open({ storage: onboarded(), init: fakeNative });
  const calls = () => page.evaluate(() => window.__native.calls); const since = async (n) => (await calls()).slice(n).map((c) => `${c.plugin}.${c.method}`);
  assert((await calls()).some((c) => c.plugin === 'Preferences' && c.method === 'get' && c.opts.key === KEY), 'Preferences not read at launch');
  await openGame(page, 'rule_shift'); await play(page, 'rule_shift', { lang: 'fr' }); await resultScore(page);
  const all = await calls(); assert(all.some((c) => c.plugin === 'Preferences' && c.method === 'set'), 'result not written to Preferences'); assert(all.some((c) => c.plugin === 'Haptics'), 'no haptic call');
  assert(JSON.parse(await page.evaluate((k) => window.__native.prefs[k], KEY)).sessions.length === 1, 'native copy of the session');
  await page.click('[data-action=profile]');
  for (const [kind, mime] of [['json', 'json'], ['pdf', 'pdf']]) {
    let n = (await calls()).length; await page.click(`[data-action=export-${kind}]`); await page.waitForFunction((k) => document.documentElement.dataset.lastExport === `${k}:shared`, kind);
    const seq = (await since(n)).filter((c) => !c.startsWith('Haptics')); assert(seq.join(' > ') === 'Filesystem.writeFile > Share.share > Filesystem.deleteFile', `sequence ${seq}`);
    const c = (await calls()).slice(n); const w = c.find((x) => x.method === 'writeFile').opts; const sh = c.find((x) => x.method === 'share').opts; const del = c.find((x) => x.method === 'deleteFile').opts;
    assert(new RegExp(`^exports/cognisphere-resultats-\\d{4}-\\d{2}-\\d{2}\\.${mime}$`).test(w.path) && w.directory === 'CACHE' && w.encoding === undefined, `write ${JSON.stringify(w)}`); assert(sh.files.length === 1 && sh.files[0] === `file:///cache/${w.path}` && !sh.text && !sh.url, 'share must carry the file only'); assert(del.path === w.path, 'temp file not cleaned');
  }
  await page.waitForSelector('.toast', { state: 'detached' }); await page.evaluate(() => { document.documentElement.dataset.lastExport = ''; window.__native.shareMode = 'cancel'; }); let n = (await calls()).length; await page.click('[data-action=export-json]'); await page.waitForFunction(() => document.documentElement.dataset.lastExport === 'json:cancelled');
  assert((await since(n)).includes('Filesystem.deleteFile'), 'no cleanup after cancel'); assert(!(await page.$('.toast')), 'cancel must be silent');
  await page.evaluate(() => { window.__native.shareMode = 'fail'; }); n = (await calls()).length; await page.click('[data-action=export-pdf]'); await page.waitForFunction(() => document.documentElement.dataset.lastExport === 'pdf:error'); assert((await since(n)).includes('Filesystem.deleteFile'), 'no cleanup after failure'); assert((await page.textContent('.toast')) === strings('fr').profile.exportFail, 'failure message');
  // haptics can be switched off
  await tab(page, 'more'); await page.click('[data-setting=haptics] [data-value=false]'); n = (await calls()).length; await tab(page, 'games'); await tab(page, 'home'); await openGame(page, 'rule_shift'); await page.click('[data-answer=yes]'); await page.waitForTimeout(300);
  assert(!(await since(n)).some((c) => c.startsWith('Haptics')), 'haptics fired while disabled'); assert(log.errors.length === 0, `errors ${log.errors}`); await context.close();
});

await browser.close(); server.close();
const summary = { passed: results.filter((r) => r.status === 'passed').length, failed: results.filter((r) => r.status === 'failed').length };
await writeFile(path.join(outDir, 'e2e-results.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), engine: `Chromium ${browser.version()} (headless), not iOS WebKit`, bundle: 'www/ (release build)', summary, results, matrix }, null, 2)}\n`);
console.log(`\n${summary.passed} passed, ${summary.failed} failed`);
process.exit(summary.failed ? 1 : 0);
