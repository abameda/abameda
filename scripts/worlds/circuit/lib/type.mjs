// Typography as geometry. Every string is set at build time from the real font outlines
// (fonts/*.woff2, decoded by woff2.mjs) and emitted as <use> references to per-SVG glyph defs.
// No web font loads at view time, so nothing can fall back to Arial, and widths are exact.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadFont } from './woff2.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// D = Archivo Expanded 800 (etched markings), M = Martian Mono 400 (silkscreen), B = Archivo 500 (prose).
const FILES = { D: 'archivo-x800.woff2', M: 'martian-400.woff2', B: 'archivo-500.woff2' };
const FONTS = {};
const font = k => (FONTS[k] ||= loadFont(join(ROOT, 'fonts', FILES[k])));

// Glyphs the Latin subsets do not carry, drawn in font units (y down), shared by all three faces.
const EXTRA = {
  0x2197: { d: 'M230 -650L540 -650L540 -340L465 -340L465 -522L133 -190L80 -243L412 -575L230 -575Z', adv: 620 }, // north-east arrow
  0x2192: { d: 'M60 -292L452 -292L318 -158L371 -105L596 -330L371 -555L318 -502L452 -368L60 -368Z', adv: 660 },    // right arrow
  0x2194: { d: 'M150 -292L510 -292L376 -158L429 -105L654 -330L429 -555L376 -502L510 -368L150 -368L284 -502L231 -555L6 -330L231 -105L284 -158Z', adv: 660 },
};

const r1 = n => Math.round(n * 10) / 10;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function glyph(k, ch) {
  const cp = ch.codePointAt(0); const f = font(k);
  if (EXTRA[cp]) return { id: `${k}u${cp.toString(16)}`, adv: EXTRA[cp].adv };
  let g = f.gid(cp);
  if (g == null) { const alt = { 0x2011: 45, 0x2212: 45, 0x00a0: 32 }[cp]; g = alt != null ? f.gid(alt) : f.gid(63); }
  return { id: f.path(g) ? `${k}${g}` : null, adv: f.adv(g) };
}

// Advance width in px (letter-spacing between glyphs, none after the last).
export function tw(s, size, k = 'M', ls = 0) {
  const chars = [...String(s)]; if (!chars.length) return 0;
  const u = font(k).upm;
  return chars.reduce((a, ch) => a + glyph(k, ch).adv, 0) * size / u + ls * (chars.length - 1);
}

// Largest size <= max at which s fits in maxW.
export const fit = (s, maxW, max, k = 'D', ls = 0) => Math.min(max, (maxW - ls * Math.max(0, [...String(s)].length - 1)) / (tw(s, 1, k) || 1));

export function text(x, y, s, { size = 14, font: k = 'M', fill = '#ECE7DA', anchor = 'start', ls = 0, op, cls, extra = '' } = {}) {
  const f = font(k), sc = size / f.upm, lsu = ls / sc;
  let pen = 0, uses = '';
  for (const ch of String(s)) {
    const g = glyph(k, ch);
    if (g.id) uses += `<use href="#${g.id}" x="${Math.round(pen)}"/>`;
    pen += g.adv + lsu;
  }
  const w = String(s).length ? (pen - lsu) * sc : 0;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return `<g transform="translate(${r1(x0)} ${r1(y)}) scale(${+sc.toFixed(5)})" fill="${fill}"${op != null ? ` opacity="${op}"` : ''}${cls ? ` class="${cls}"` : ''}${extra}>${uses}</g>`;
}

// Glyph outlines for every glyph a document references, emitted once per SVG.
export function glyphDefs(body) {
  const ids = [...new Set([...body.matchAll(/href="#([DMB](?:u[0-9a-f]+|\d+))"/g)].map(m => m[1]))].sort();
  return ids.map(id => {
    const k = id[0], rest = id.slice(1);
    const d = rest[0] === 'u' ? EXTRA[parseInt(rest.slice(1), 16)].d : font(k).path(+rest);
    return `<path id="${id}" d="${d}"/>`;
  }).join('');
}

// Greedy word wrap with exact widths. Prefers a comma break when both halves fit.
export function wrap(s, maxW, size, k = 'B', ls = 0) {
  s = String(s);
  if (tw(s, size, k, ls) <= maxW) return [s];
  const c = s.indexOf(', ');
  if (c > 0 && tw(s.slice(0, c + 1), size, k, ls) <= maxW && tw(s.slice(c + 2), size, k, ls) <= maxW) return [s.slice(0, c + 1), s.slice(c + 2)];
  const lines = []; let cur = '';
  for (const wd of s.split(/\s+/)) {
    const t = cur ? cur + ' ' + wd : wd;
    if (tw(t, size, k, ls) > maxW && cur) { lines.push(cur); cur = wd; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

// Two-line wrap that balances the lines (and prefers a comma break) instead of leaving an orphan.
function balanced(s, maxW, z, k, ls, maxLines) {
  const greedy = wrap(s, maxW, z, k, ls);
  if (greedy.length > maxLines) return null;
  if (greedy.length !== 2) return greedy;
  const words = s.split(/\s+/); let best = null, bw = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
    const wa = tw(a, z, k, ls), wb = tw(b, z, k, ls);
    if (wa > maxW || wb > maxW) continue;
    const m = Math.max(wa, wb) * (/,$/.test(a) ? 0.8 : 1) * (/^[·/&]/.test(b) || /[·/&]$/.test(a) ? 1.3 : 1);
    if (m < bw) { bw = m; best = [a, b]; }
  }
  return best || greedy;
}

// Fit s into at most maxLines: one line if a small shrink allows it, else balanced lines at the
// largest size down to min, else ellipsize the last line.
export function fitLines(s, maxW, size, maxLines, { font: k = 'B', min = size - 3, ls = 0 } = {}) {
  s = String(s);
  for (let z = size; z >= Math.max(min, size - 2); z -= 1) if (tw(s, z, k, ls) <= maxW) return { lines: [s], size: z };
  for (let z = size; z >= min; z -= 1) { const lines = balanced(s, maxW, z, k, ls, maxLines); if (lines) return { lines, size: z }; }
  const lines = wrap(s, maxW, min, k, ls).slice(0, maxLines);
  let last = lines[maxLines - 1];
  while (last.length > 1 && tw(last + '…', min, k, ls) > maxW) last = last.replace(/\s*\S+$/, '') || last.slice(0, -1);
  lines[maxLines - 1] = last.replace(/[,;:·\s]+$/, '') + '…';
  return { lines, size: min };
}

export { esc };
