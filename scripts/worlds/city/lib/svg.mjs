// Shared SVG helpers: document wrapper, embedded fonts, colour maths, seeded randomness, dates.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { displayWidth } from './metrics.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FONT_DIR = join(HERE, '..', 'fonts');

// Display face for signage, mono face for plaques and micro-labels.
export const DISPLAY = "'CityDisplay','Big Shoulders Display','Arial Narrow',Impact,sans-serif";
export const MONO = "'CityMono','DM Mono',ui-monospace,Consolas,monospace";

const fontCache = {};
function fontB64(file) {
  if (!fontCache[file]) fontCache[file] = readFileSync(join(FONT_DIR, file)).toString('base64');
  return fontCache[file];
}
export function fontFaces({ display = true, mono = true, arabic = false } = {}) {
  let css = '';
  if (display) css += `@font-face{font-family:'CityDisplay';font-weight:800;font-display:swap;src:url(data:font/woff2;base64,${fontB64('bsd-800.woff2')}) format('woff2')}`;
  if (mono) css += `@font-face{font-family:'CityMono';font-weight:500;font-display:swap;src:url(data:font/woff2;base64,${fontB64('dmmono-500.woff2')}) format('woff2')}`;
  // Reem Kufi 700, subset to the Arabic street names only (tools/get-arabic-font.mjs), about 4 KB.
  if (arabic) css += `@font-face{font-family:'CityArabic';font-weight:700;font-display:swap;src:url(data:font/woff2;base64,${fontB64('reemkufi-700-ar.woff2')}) format('woff2')}`;
  return css;
}
export const ARABIC = "'CityArabic','Segoe UI','Noto Kufi Arabic','Geeza Pro',sans-serif";

// DM Mono advances are a flat 0.6em, so mono text can be measured exactly.
export const monoW = (text, size, ls = 0) => [...String(text)].length * (0.6 * size + ls) - ls;
// Largest size <= base at which mono text fits maxW.
export const monoFit = (text, maxW, base, ls = 0) => Math.min(base, ((maxW + ls) / [...String(text)].length - ls) / 0.6);
// Cut mono text at a word boundary and add an ellipsis so it fits maxW; never mid-word.
export function ellipsize(text, maxW, size, ls = 0) {
  if (monoW(text, size, ls) <= maxW) return text;
  const words = String(text).split(' ');
  while (words.length > 1) { words.pop(); const t = words.join(' ').replace(/[,·:;\-]+$/, '') + '…'; if (monoW(t, size, ls) <= maxW) return t; }
  return words[0];
}
// Outlined stack pill sized from the measured text: w = text + 2 * pad.
export function pill(x, y, text, { size = 12, ls = 1.2, pad = 11, h = 24, stroke = '#6c5a98', color = '#c9b8f0' } = {}) {
  const t = String(text).toUpperCase(), w = monoW(t, size, ls) + 2 * pad;
  return {
    w, svg: `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${h}" rx="5" fill="none" stroke="${stroke}"/>`
      + `<text x="${f(x + pad)}" y="${f(y + h / 2 + size * 0.36)}" class="m" font-size="${size}" fill="${color}" letter-spacing="${ls}">${esc(t)}</text>`,
  };
}
// The profile project that a repo belongs to (data.json speaks in repo names, the page in project names).
export const projectOf = (projects, repoName) => projects.find(p => p.repo && p.repo.toLowerCase() === String(repoName).toLowerCase());
export function newestWork(data, projects) {
  const repo = (data.repos || []).slice().sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))[0];
  if (!repo) return null;
  const p = projectOf(projects, repo.name);
  return { repo, name: p ? p.name : repo.name.replace(/[-_]+/g, ' ').toUpperCase(), days: Math.floor(daysSinceRaw(repo.pushedAt, data.generatedAt)) };
}
const daysSinceRaw = (iso, nowIso) => Math.max(0, (new Date(nowIso) - new Date(iso)) / 86400000);

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const f = n => (Math.round(n * 10) / 10).toString();
// Pin display text to its measured width (see metrics.mjs).
export const TL = (text, size, ls = 0) => `textLength="${(Math.round(displayWidth(text, size, ls) * 100) / 100)}" lengthAdjust="spacingAndGlyphs"`;

// Full SVG document. `css` is extra CSS; reduced-motion freezes every animation on its resting frame.
// Every image carries a transparent side gutter (GUTTER units each side) so that, laid edge to edge
// in the README with no spaces, all cards share one grid: full-width cards, half tiles and the
// station strip line up on both edges, and the gap between neighbours is always 2 x GUTTER.
export const GUTTER = 12;
export function svgDoc({ w, h, title, desc = '', css = '', defs = '', body, fonts = {}, gutter = [GUTTER, GUTTER] }) {
  const [gl, gr] = gutter, vw = w + gl + gr;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-gl} 0 ${vw} ${h}" width="${vw}" height="${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>
<style>${fontFaces(fonts)}
.d{font-family:${DISPLAY};font-weight:800}.m{font-family:${MONO};font-weight:500}${fonts.arabic ? `.a{font-family:${ARABIC};font-weight:700}` : ''}
${css}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<defs>${defs}</defs>
${body}
</svg>`;
}

// ---------- colour ----------
const hex2 = h => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const rgb2 = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hex2(a), B = hex2(b); return rgb2(A.map((v, i) => v + (B[i] - v) * t)); };

// One light model for the whole city: dusk sky above (tops), the setting sun to the right
// (right faces warm), cool shadow on the left faces.
export function shade(base) {
  return { top: mix(base, '#f6dcff', 0.38), right: mix(mix(base, '#ff9f7c', 0.22), '#000', 0.04), left: mix(base, '#120a2a', 0.46), base };
}

// Palette
export const P = {
  ink: '#0f0a24', night: '#170f33', plum: '#2a1a4d', violet: '#4b2f7f', dusk: '#7a3f8f',
  coral: '#ff7a6b', peach: '#ffb48a', amber: '#ffc463', amberHot: '#ffdf9a', cream: '#fff1df',
  lav: '#c9b8f0', mute: '#9a88c6', dim: '#6c5a98', teal: '#6fe3e1', rose: '#ff9db0',
};

// ---------- deterministic randomness ----------
export function rng(seed) {
  let s = typeof seed === 'string' ? [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) : seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- dates & numbers ----------
export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const fmtDate = iso => { const d = new Date(iso); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
export const fmtNum = n => Number(n).toLocaleString('en-US');
export function ago(iso, nowIso) {
  const days = Math.floor((new Date(nowIso) - new Date(iso)) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  if (days < 730) return `${Math.round(days / 30.4)} months ago`;
  return `${Math.round(days / 365)} years ago`;
}
export const daysSince = (iso, nowIso) => Math.max(0, (new Date(nowIso) - new Date(iso)) / 86400000);

// Moon phase 0..1 (0 = new, .5 = full) for the build date. Reference new moon 2000-01-06 18:14 UTC.
export function moonPhase(iso) {
  const syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14);
  const p = (((new Date(iso) - ref) / 86400000) % syn + syn) % syn;
  return p / syn;
}
// SVG path for the lit part of a moon of radius r at (cx,cy).
export function moonPath(cx, cy, r, phase) {
  const waxing = phase < 0.5, k = Math.cos(phase * 2 * Math.PI); // 1 new → -1 full
  const rx = Math.abs(k) * r, sweepOuter = waxing ? 1 : 0;
  const top = `${f(cx)} ${f(cy - r)}`, bot = `${f(cx)} ${f(cy + r)}`;
  const sweepTerm = waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0); // terminator bulge direction
  return `M${top} A${f(r)} ${f(r)} 0 0 ${sweepOuter} ${bot} A${f(rx)} ${f(r)} 0 0 ${sweepTerm} ${top}Z`;
}

export function moonName(p) {
  const n = ['NEW MOON', 'WAXING CRESCENT', 'FIRST QUARTER', 'WAXING GIBBOUS', 'FULL MOON', 'WANING GIBBOUS', 'LAST QUARTER', 'WANING CRESCENT'];
  return n[Math.round(p * 8) % 8];
}

// Small shared pieces
export const tag = (x, y, text, { size = 13, fill = P.mute, anchor = 'start', ls = 2.2, cls = 'm', extra = '' } = {}) =>
  `<text x="${f(x)}" y="${f(y)}" class="${cls}" font-size="${size}" fill="${fill}" letter-spacing="${ls}" text-anchor="${anchor}" ${extra}>${esc(text)}</text>`;

export function stars(w, h, n, seed, { maxY = h, cls = 'tw' } = {}) {
  const r = rng(seed); let s = '';
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * maxY * r(), rad = 0.5 + r() * 1.3, o = 0.35 + r() * 0.6;
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="#fff4e8" opacity="${f(o)}"${i % 3 === 0 ? ` class="${cls}" style="animation-delay:-${f(r() * 6)}s"` : ''}/>`;
  }
  return s;
}
