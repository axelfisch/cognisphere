// Builds the offline web bundle into www/: one entry module + lazily loaded chunks (jsPDF), fonts, CSS, HTML.
import { build } from 'esbuild';
import { rm, mkdir, copyFile, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'www');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));

await rm(out, { recursive: true, force: true });
await mkdir(path.join(out, 'fonts'), { recursive: true });

await build({
  entryPoints: { app: path.join(root, 'src/main.js') },
  outdir: out, bundle: true, format: 'esm', splitting: true, minify: true, target: ['safari15'], legalComments: 'none',
  chunkNames: 'chunks/[name]-[hash]', define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  external: ['html2canvas', 'dompurify', 'canvg'], // optional jsPDF features (HTML/SVG rendering) that the app never calls
  logLevel: 'warning',
});

const fonts = [
  ...[400, 500, 600, 700].map((w) => [`@fontsource/sora/files/sora-latin-${w}-normal.woff2`, `sora-latin-${w}-normal.woff2`]),
  ['@fontsource/dm-serif-display/files/dm-serif-display-latin-400-normal.woff2', 'dm-serif-display-latin-400-normal.woff2'],
  ['@fontsource/dm-serif-display/files/dm-serif-display-latin-400-italic.woff2', 'dm-serif-display-latin-400-italic.woff2'],
];
for (const [from, to] of fonts) await copyFile(path.join(root, 'node_modules', from), path.join(out, 'fonts', to));
await copyFile(path.join(root, 'src/styles.css'), path.join(out, 'styles.css'));
await writeFile(path.join(out, 'index.html'), await readFile(path.join(root, 'src/index.html'), 'utf8'));

async function size(dir) { let total = 0; for (const e of await readdir(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); total += e.isDirectory() ? await size(p) : (await stat(p)).size; } return total; }
console.log(`www/ built — ${(await size(out) / 1024).toFixed(0)} kB total, version ${pkg.version}`);
