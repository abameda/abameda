// Data helpers: wrapping, dates, repo lookup, language-to-hatch mapping (consistent across sheets).
import { HATCHES } from './svg.mjs';

export function wrap(text, max) {
  const out = []; let line = '';
  for (const w of String(text).split(/\s+/)) {
    if (line && (line + ' ' + w).length > max) { out.push(line); line = w; } else line = line ? line + ' ' + w : w;
  }
  if (line) out.push(line);
  return out;
}

export const ymd = iso => (iso || '').slice(0, 10);
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const monthName = i => MON[i];
export function dmy(iso) { const d = new Date(iso); return `${String(d.getUTCDate()).padStart(2, '0')} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`; }
export function daysBetween(a, b) { return Math.round((Date.parse(ymd(b)) - Date.parse(ymd(a))) / 86400000); }
export function ago(iso, nowIso) {
  const d = daysBetween(iso, nowIso);
  if (d <= 0) return 'TODAY';
  if (d === 1) return 'YESTERDAY';
  if (d < 60) return `${d} DAYS AGO`;
  const m = Math.round(d / 30.4);
  return m < 18 ? `${m} MONTHS AGO` : `${Math.round(d / 365)} YEARS AGO`;
}

export const repoFor = (data, name) => (data.repos || []).find(r => r.name.toLowerCase() === String(name).toLowerCase());

// Each language gets a drafting material hatch, ordered by its global share (largest = ANSI 31).
export function langHatch(data) {
  const order = (data.languages || []).map(l => l.name);
  return name => { const i = order.indexOf(name); return HATCHES[(i < 0 ? order.length : i) % HATCHES.length]; };
}

// Repo language shares (by bytes), small ones folded into OTHER.
export function repoLangs(repo, min = 0.04) {
  const ls = repo?.languages || [], tot = ls.reduce((a, l) => a + l.bytes, 0);
  if (!tot) return [];
  const big = ls.filter(l => l.bytes / tot >= min).map(l => ({ name: l.name, share: l.bytes / tot }));
  const rest = 1 - big.reduce((a, l) => a + l.share, 0);
  if (rest > 0.001) big.push({ name: 'OTHER', share: rest });
  return big;
}

// "588,545 unique tech job postings from 8 sources, 159 countries..." -> [{n, label}]
export function figures(line) {
  const out = [], re = /(\d[\d,.]*)\s+([^,.;]+?)(?=\s+(?:from|and|showing|over|across|in|with)\b|[,.;]|$)/gi;
  let m; while ((m = re.exec(line))) out.push({ n: m[1], label: m[2].trim() });
  return out;
}

// Approximate advance width of uppercase text in the expanded display face (em units).
export const dispWidth = (s, size) => [...String(s)].reduce((a, c) => a + (c === ' ' ? 0.32 : /[MW]/.test(c) ? 1.14 : /[I1.,:]/.test(c) ? 0.42 : 0.93), 0) * size;
export const fitSize = (s, max, maxW) => Math.min(max, maxW / (dispWidth(s, 1) || 1));

// "...company: branch and IP validation, role-based access, analytics" -> ['branch and IP validation', ...]
export function features(line) {
  const tail = String(line).includes(':') ? line.split(':').slice(1).join(':') : line;
  const out = tail.replace(/\.$/, '').split(/,\s*/).map(s => s.trim().replace(/^and\s+/i, '').replace(/^the\s+/i, '')).filter(Boolean);
  // a list without the serial comma ends "x and y": split that last item too
  const last = out.length > 1 ? out.at(-1).split(/\s+and\s+/) : [];
  if (last.length === 2 && last.every(s => s.split(' ').length <= 4)) out.splice(-1, 1, ...last);
  return out;
}

// Balanced wrap: keep the line count of a greedy wrap, then narrow the measure until the
// lines even out, so a paragraph never ends on a one-word widow.
export function balance(text, max) {
  const base = wrap(text, max), n = base.length;
  if (n < 2) return base;
  let best = base;
  for (let m = max - 1; m >= Math.ceil(max * 0.55); m--) { const t = wrap(text, m); if (t.length > n) break; best = t; }
  return best;
}

// Fit a paragraph into `width` units and at most `maxLines`, stepping the size down before
// ever truncating. Plex Mono advance = 0.6 em. Returns { size, lines, lh }.
export function fitLines(text, width, sizes, maxLines, ls = 0, extra = 0) {
  const per = size => Math.max(8, Math.floor(width / (size * 0.6 + ls)));
  for (const size of sizes) {
    const lines = balance(text, per(size));
    if (lines.length <= maxLines) return { size, lines, lh: Math.round(size * 1.42) };
  }
  // at the smallest size a layout that can grow may take `extra` more lines; only then truncate
  const all = balance(text, per(sizes.at(-1)));
  if (all.length <= maxLines + extra) return { size: sizes.at(-1), lines: all, lh: Math.round(sizes.at(-1) * 1.42) };
  const size = sizes.at(-1), lines = wrap(text, per(size)).slice(0, maxLines + extra);
  maxLines += extra;
  lines[maxLines - 1] = lines[maxLines - 1].replace(/[\s,.;:]*$/, '') + '…';
  return { size, lines, lh: Math.round(size * 1.42) };
}

export const host = u => String(u).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
// Mono text width in units (Plex Mono 0.6 em advance + letter-spacing).
export const monoWidth = (s, size, ls = 0) => String(s).length * (size * 0.6 + ls);
