// Renders the App Store icon (1024×1024, opaque, no rounded corners) and the launch image from src/assets/logo.svg.
// Dev-only: needs Playwright's Chromium and Python Pillow (alpha removal). Outputs are committed, so Xcode never needs this.
import { createRequire } from 'node:module';
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const svg = await readFile(path.join(root, 'src/assets/logo.svg'), 'utf8');
const assets = path.join(root, 'ios/App/App/Assets.xcassets');
const browser = await chromium.launch();
async function render(html, size, file) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0;width:${size}px;height:${size}px;background:#0e1117;display:flex;align-items:center;justify-content:center}</style>${html}`);
  await page.screenshot({ path: file, omitBackground: false }); await page.close();
  execFileSync('python3', ['-c', 'import sys;from PIL import Image;p=sys.argv[1];Image.open(p).convert("RGB").save(p,optimize=True)', file]);
}
const icon = path.join(assets, 'AppIcon.appiconset/AppIcon-512@2x.png');
await render(svg.replace('<svg ', '<svg width="1024" height="1024" '), 1024, icon);
const splash = path.join(assets, 'Splash.imageset/splash-2732x2732.png');
await render(`<div style="width:520px;height:520px;border-radius:118px;overflow:hidden;box-shadow:0 30px 120px rgba(124,140,248,.35)">${svg.replace('<svg ', '<svg width="520" height="520" ')}</div>`, 2732, splash);
for (const n of ['splash-2732x2732-1.png', 'splash-2732x2732-2.png']) await copyFile(splash, path.join(assets, 'Splash.imageset', n));
await copyFile(icon, path.join(root, 'appstore/icon-1024.png')).catch(() => {});
await browser.close();
console.log('icon + launch image written');
