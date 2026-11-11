import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { jsPDF } from 'jspdf';
import { buildJson, jsonText, buildPdf, fileName, pdfSafe, utf8ToBase64 } from '../../src/export/exporter.js';
import { applyResult, emptyData } from '../../src/core/storage.js';
import { GAMES } from '../../src/core/catalog.js';

const NOW = Date.UTC(2026, 10, 11, 9, 30);
function filled(n) { let d = emptyData(); for (let i = 0; i < n; i++) d = applyResult(d, { sessionId: `s${i}`, gameId: GAMES[i % 8].id, score: i === 0 ? 0 : (i * 37) % 101, correct: 1, total: 5, ts: NOW - (n - i) * 3600000 }).data; return d; }
function pdfText(doc) { const dir = mkdtempSync(path.join(tmpdir(), 'cogni-')); const f = path.join(dir, 'out.pdf'); writeFileSync(f, Buffer.from(doc.output('arraybuffer'))); return { text: execFileSync('pdftotext', ['-layout', f, '-'], { encoding: 'utf8' }), pages: Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [f], { encoding: 'utf8' }))[1]) }; }

test('JSON export: versioned, readable, distinguishes unplayed from zero', () => {
  const empty = buildJson(emptyData(), 'fr', NOW, '1.0.0');
  assert.equal(empty.exportVersion, 1); assert.equal(empty.schema, 3); assert.equal(empty.summary.average, null); assert.equal(empty.domains.length, 9); assert.ok(empty.domains.every((d) => d.played === false && d.score === null)); assert.deepEqual(empty.sessions, []);
  assert.match(empty.note, /jeu/); assert.equal(empty.exportedAt, '2026-11-11T09:30:00.000Z');
  const full = buildJson(filled(20), 'en', NOW, '1.0.0');
  assert.equal(full.summary.domainsPlayed, 8); assert.equal(full.sessions.length, 20); assert.equal(full.domains.find((d) => d.id === 'flex').played, false);
  assert.equal(full.domains.find((d) => d.id === 'reasoning').gameLabel, 'Logic Bridge'); assert.ok(full.sessions.every((s) => s.scoringVersion === 2 && /^\d{4}-/.test(s.playedAt)));
  const text = jsonText(filled(3), 'fr', NOW, '1.0.0'); assert.ok(text.includes('\n  "summary"')); assert.deepEqual(JSON.parse(text).language, 'fr');
  assert.equal(Buffer.from(utf8ToBase64(text), 'base64').toString('utf8'), text, 'accents survive the base64 step');
  assert.doesNotMatch(JSON.stringify(full) + JSON.stringify(empty), /\bIQ\b|\bQI\b|diagnos(?!tic\b|is\b)|clinical|clinique/i);
});

test('PDF export: empty profile, FR accents, playful notice', { skip: !hasPoppler() }, () => {
  const { text, pages } = pdfText(buildPdf(jsPDF, emptyData(), 'fr', NOW));
  assert.equal(pages, 1); assert.match(text, /Cognisphere - résultats de jeu/); assert.match(text, /Généré le 11 novembre 2026/); assert.match(text, /Cognisphere est un jeu/);
  assert.match(text, /Mémoire de travail\s+Pile mémorielle\s+Non joué/); assert.match(text, /Aucune session terminée/); assert.match(text, /Page 1 sur 1/); assert.doesNotMatch(text, /\?{2,}|�/);
});

test('PDF export: filled profile in EN shows scores, a played 0 and the history', { skip: !hasPoppler() }, () => {
  const { text } = pdfText(buildPdf(jsPDF, filled(12), 'en', NOW));
  assert.match(text, /Domains played\s+8\s*\/\s*9/); assert.match(text, /Logical reasoning\s+Logic Bridge\s+\d+\s+2/); assert.match(text, /Mental flexibility\s+Rule Shift\s+Not played/);
  assert.match(text, /Logic Bridge\s+Logical reasoning\s+0 \/ 100/, 'a session played at zero prints 0'); assert.equal((text.match(/\/ 100\n/g) || []).length >= 12, true);
});

test('PDF export: a 60-session history is paginated with a repeated header and page numbers', { skip: !hasPoppler() }, () => {
  const data = filled(75); assert.equal(data.sessions.length, 60);
  const { text, pages } = pdfText(buildPdf(jsPDF, data, 'fr', NOW));
  assert.ok(pages >= 2); assert.match(text, new RegExp(`Page ${pages} sur ${pages}`)); assert.equal((text.match(/ \/ 100$/gm) || []).length, 61, '60 history rows + the average line');
});

test('file names and PDF text sanitising', () => {
  assert.equal(fileName('pdf', 'fr', new Date(2026, 10, 11).getTime()), 'cognisphere-resultats-2026-11-11.pdf'); assert.equal(fileName('json', 'en', new Date(2026, 0, 5).getTime()), 'cognisphere-results-2026-01-05.json');
  assert.equal(pdfSafe('L’été — « œuf » 60 % ✓'), "L'été - « oeuf » 60 % ", 'Latin-1 characters (accents, guillemets) are kept');
});

function hasPoppler() { try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); return true; } catch { return false; } }
