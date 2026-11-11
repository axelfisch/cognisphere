// Captures the main screens of the built bundle in FR and EN at App Store 6.9" size (1320×2868 = 440×956 pt @3x).
// These come from headless Chromium, not from an iPhone simulator: use them as layout previews / drafts and
// re-capture on a simulator before submission (see appstore/README.md). SCALE=1 gives small review images.
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { serve } from './serve.mjs';
import { GAMES } from '../src/core/catalog.js';

const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scale = Number(process.env.SCALE || 3); const outRoot = process.env.OUT || path.join(root, 'appstore/screenshots');
const { server, url } = await serve(0); const browser = await chromium.launch();
const now = Date.now(); const scores = [80, 67, 83, 60, 83, 67, 100, 80, 75];
const seed = (lang, theme) => { const d = { schema: 3, scoringVersion: 2, domains: {}, sessions: [], prefs: { lang, theme, haptics: true, onboarded: true } };
  GAMES.forEach((g, i) => { if (i === 4) return; d.domains[g.domain] = { score: scores[i], plays: 1 + (i % 3), best: Math.min(100, scores[i] + 8), lastTs: now - i * 86400000 }; d.sessions.push({ id: `p${i}`, game: g.id, domain: g.domain, score: scores[i], ts: now - i * 5400000, sv: 2 }); }); return JSON.stringify(d); };

for (const [lang, theme] of [['fr', 'dark'], ['en', 'light']]) {
  const dir = path.join(outRoot, `${lang}-${theme}`); await mkdir(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 440, height: 956 }, deviceScaleFactor: scale, locale: lang === 'fr' ? 'fr-FR' : 'en-GB', hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  await ctx.addInitScript((s) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('cognisphere_ios_v3', s); sessionStorage.setItem('seeded', '1'); } }, seed(lang, theme));
  const page = await ctx.newPage(); await page.goto(url); await page.waitForSelector('html[data-ready]');
  let n = 0; const shot = async (name) => { await page.waitForTimeout(350); n += 1; await page.screenshot({ path: path.join(dir, `${String(n).padStart(2, '0')}-${name}.png`) }); };
  const tab = (id) => page.click(`.tabbar [data-tab=${id}]`);
  await shot('home'); await tab('games'); await shot('games');
  await page.click('[data-game=rule_shift]'); await shot('detail'); await page.click('[data-action=play]'); await page.waitForSelector('.round.shift'); await shot('play-rule-shift');
  await page.click('[data-action=quit]'); await page.click('[data-dialog=quit] [data-action=confirm]'); await page.click('[data-action=back]');
  await page.click('[data-game=pattern_tri]'); await page.click('[data-action=play]'); await page.waitForSelector('.tris'); await shot('play-pattern-triangles');
  await page.click('[data-action=quit]'); await page.click('[data-dialog=quit] [data-action=confirm]'); await page.click('[data-action=back]');
  await page.click('[data-game=reality_rank]'); await page.click('[data-action=play]'); await page.waitForSelector('.pool .opt'); await page.click('.pool .opt'); await page.click('.pool .opt'); await shot('play-reality-rank');
  await page.click('[data-action=quit]'); await page.click('[data-dialog=quit] [data-action=confirm]'); await page.click('[data-action=back]');
  await page.click('[data-game=num_sequence]'); await page.click('[data-action=play]'); await page.waitForSelector('.seq'); await page.click('.round .opt'); await shot('play-number-sequence-feedback');
  for (let i = 0; i < 5; i++) { await page.click('[data-action=next]'); if (i < 4) await page.click('.round .opt'); }
  await page.waitForSelector('[data-screen=result]'); await shot('result'); await page.click('[data-action=profile]'); await shot('profile');
  await page.evaluate(() => { document.getElementById('view').scrollTop = 560; }); await shot('profile-domains');
  await tab('more'); await shot('more');
  if (theme === 'dark' && lang === 'fr') { await page.click('[data-action=intro]'); await shot('onboarding'); await page.click('[data-action=skip]'); await tab('games'); await page.click('[data-game=memory_stack]'); await page.click('[data-action=play]'); await page.waitForSelector('[data-phase=recall]', { timeout: 9000 }); await page.click('.key'); await page.click('.key:nth-child(3)'); await shot('play-memory-stack');
    await page.click('[data-action=quit]'); await page.click('[data-dialog=quit] [data-action=confirm]'); await page.click('[data-action=back]'); await page.click('[data-game=symbol_sprint]'); await page.click('[data-action=play]'); await shot('play-symbol-sprint-intro'); await page.click('[data-action=start]'); await page.waitForSelector('.stage.sprint .shape'); await page.screenshot({ path: path.join(dir, '15-play-symbol-sprint.png') });
    await page.click('[data-action=quit]'); await page.waitForSelector('[data-dialog=quit]'); await shot('quit-dialog'); }
  await ctx.close();
}
await browser.close(); server.close(); console.log('screenshots written to', outRoot);
