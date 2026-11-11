// JSON and PDF exports. Pure builders (testable in Node) + a share step that goes through the native bridge.
import { GAMES } from '../core/catalog.js';
import { SCHEMA, SCORING_VERSION, HISTORY_MAX, summarize } from '../core/storage.js';
import { strings, formatDate, formatDateTime } from '../ui/i18n.js';

export const EXPORT_VERSION = 1;

export function buildJson(data, lang, now = Date.now(), appVersion = '1.0.0') {
  const S = strings(lang); const sum = summarize(data);
  return {
    app: 'Cognisphere', platform: 'ios', appVersion, exportVersion: EXPORT_VERSION, schema: SCHEMA, scoringVersion: SCORING_VERSION,
    exportedAt: new Date(now).toISOString(), language: lang === 'fr' ? 'fr' : 'en', note: S.exp.note,
    scoring: { domainScore: 'first result, then round(0.6 × previous + 0.4 × new)', average: 'mean of played domains', historyLimit: HISTORY_MAX },
    summary: { domainsPlayed: sum.coverage, domainsTotal: GAMES.length, average: sum.average, sessionsPlayed: sum.totalPlays, sessionsInHistory: sum.historyCount },
    domains: sum.domains.map((d) => ({ id: d.domain, label: S.domains[d.domain], game: d.game, gameLabel: S.names[d.game], played: d.played, score: d.score, sessions: d.plays, best: d.best, lastPlayedAt: d.lastTs ? new Date(d.lastTs).toISOString() : null })),
    sessions: data.sessions.map((s) => ({ id: s.id, game: s.game, gameLabel: S.names[s.game], domain: s.domain, score: s.score, correct: s.correct ?? null, total: s.total ?? null, playedAt: new Date(s.ts).toISOString(), scoringVersion: s.sv })),
  };
}
export function jsonText(data, lang, now, appVersion) { return `${JSON.stringify(buildJson(data, lang, now, appVersion), null, 2)}\n`; }

// The standard PDF fonts cover Latin-1 (all French accents). Map the few typographic characters outside it.
const PDF_MAP = { '’': "'", '‘': "'", '“': '"', '”': '"', '—': '-', '–': '-', '…': '...', '×': 'x', '−': '-', '·': '-', 'œ': 'oe', 'Œ': 'OE', '\u202f': ' ', '\u2009': ' ', '«': '\"', '»': '\"', '✓': '', '✕': '' };
export function pdfSafe(text) {
  return String(text).replace(/[^\u0000-ÿ]/g, (c) => (c in PDF_MAP ? PDF_MAP[c] : '?'));
}

/** Build the PDF with jsPDF (passed in so the heavy library is loaded only when needed). Returns the jsPDF document. */
export function buildPdf(JsPDF, data, lang, now = Date.now()) {
  const S = strings(lang); const E = S.exp; const sum = summarize(data);
  const doc = new JsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight();
  const M = 48; const bottom = H - 56; let y = M;
  const text = (str, x, yy, opts) => doc.text(pdfSafe(str), x, yy, opts);
  const ensure = (need) => { if (y + need > bottom) { doc.addPage(); y = M; return true; } return false; };
  const heading = (label) => { ensure(40); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(20, 30, 60); text(label, M, y); y += 8; doc.setDrawColor(190, 198, 220); doc.line(M, y, W - M, y); y += 16; };
  const para = (str, size = 10) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(60, 70, 100); for (const line of doc.splitTextToSize(pdfSafe(str), W - 2 * M)) { ensure(14); doc.text(line, M, y); y += size + 4; } };

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(14, 17, 23); text(E.title, M, y + 6); y += 28;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(60, 70, 100); text(`${E.generated} ${formatDateTime(now, lang)}`, M, y); y += 18;
  para(E.note); y += 8;

  heading(E.summary);
  const rows = [[E.coverage, `${sum.coverage} / ${GAMES.length}`], [E.average, sum.average === null ? E.none : `${sum.average} / 100`], [E.total, String(sum.totalPlays)]];
  doc.setFontSize(10.5);
  for (const [k, v] of rows) { doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 70, 100); text(k, M, y); doc.setFont('helvetica', 'bold'); doc.setTextColor(14, 17, 23); text(v, W - M, y, { align: 'right' }); y += 16; }
  y += 10;

  heading(S.profile.domains);
  const cols = [M, M + 170, M + 330, M + 400, W - M];
  const tableHead = (labels) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(90, 100, 130); labels.forEach((l, i) => text(l, cols[i], y, i >= 2 ? { align: i === labels.length - 1 ? 'right' : 'left' } : undefined)); y += 14; };
  tableHead([E.domain, E.game, E.score, E.sessions, E.best]);
  for (const d of sum.domains) {
    ensure(16); doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(14, 17, 23);
    text(S.domains[d.domain], cols[0], y); text(S.names[d.game], cols[1], y);
    if (d.played) { doc.setFont('helvetica', 'bold'); text(String(d.score), cols[2], y); doc.setFont('helvetica', 'normal'); text(String(d.plays), cols[3], y); text(d.best === null ? '-' : String(d.best), cols[4], y, { align: 'right' }); }
    else { doc.setTextColor(120, 130, 160); text(E.notPlayed, cols[2], y); }
    y += 16;
  }
  y += 6; para(E.scoringNote, 9); y += 10;

  heading(E.history);
  if (!data.sessions.length) para(E.emptyHistory);
  else {
    const hcols = [M, M + 150, M + 320, W - M];
    const head = () => { doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(90, 100, 130); text(E.date, hcols[0], y); text(E.game, hcols[1], y); text(E.domain, hcols[2], y); text(E.score, hcols[3], y, { align: 'right' }); y += 14; };
    head();
    for (const s of data.sessions) {
      if (ensure(15)) head();
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(14, 17, 23);
      text(formatDate(s.ts, lang), hcols[0], y); text(S.names[s.game], hcols[1], y); text(S.domains[s.domain], hcols[2], y);
      doc.setFont('helvetica', 'bold'); text(`${s.score} / 100`, hcols[3], y, { align: 'right' }); y += 15;
    }
  }
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) { doc.setPage(p); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(120, 130, 160); text('Cognisphere', M, H - 28); text(E.page(p, pages), W - M, H - 28, { align: 'right' }); }
  doc.setProperties({ title: pdfSafe(E.title), subject: pdfSafe(E.note), creator: 'Cognisphere' });
  return doc;
}

export function fileName(kind, lang, now = Date.now()) {
  const d = new Date(now); const pad = (n) => String(n).padStart(2, '0');
  return `${strings(lang).exp.filePrefix}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.${kind}`;
}

export function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text); let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
