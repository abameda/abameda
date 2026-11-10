// Shared pieces of the project cards: the building-on-a-plot scene, the city-map vocabulary,
// recency from data.json, text fitting and the card frame.
import { f, esc, P as PAL, ago, daysSince, monoW, ellipsize } from './svg.mjs';
import { displayWidth } from './metrics.mjs';
import { iso } from './iso.mjs';
import { cortex, ops, dose, attendance, bosla, lightUp } from './buildings-a.mjs';
import { mnu, thread, printer, yosr, tree, lamp, palm } from './buildings-b.mjs';
import { townhouse, townhouseSpec } from './buildings-c.mjs';

// What each project is as a building (design copy, not facts). New projects get a new quarter.
const PLACES = {
  cortex: 'THE AI TOWER · DOWNTOWN', 'cortex-ops': 'OPS ANNEX · DOWNTOWN', dose: 'FLACON BOUTIQUE · RIVERSIDE',
  attendance: 'HEADQUARTERS · CIVIC SQUARE', bosla: 'COMPASS OBSERVATORY · DATA PLAZA', thread: 'ATELIER · TAILORS ROW',
  'mnu-sms': 'UNIVERSITY HALL · CAMPUS', printer: 'PRINT SHOP · BRANCH ROAD', yosr: 'CONSTRUCTION SITE · NORTH BANK',
};
export const place = p => PLACES[p.key] || 'TOWNHOUSE · NEW QUARTER';
const DRAW = { cortex, 'cortex-ops': ops, dose, attendance, bosla, thread, 'mnu-sms': mnu, printer, yosr };
// Illustration rigs: scale, plot size, building origin on the plot, plot centre height.
const RIG = {
  cortex: { S: 17.5, plot: [7, 7], b: [1.5, 1.5], cy: 340 },
  dose: { S: 34, plot: [6, 6], b: [1.2, 1.2], cy: 282 },
  attendance: { S: 23.5, plot: [7.4, 7.4], b: [1.2, 0.8], cy: 306 },
  bosla: { S: 31, plot: [6.4, 6.4], b: [1.2, 1.2], cy: 290 },
  'cortex-ops': { S: 24, plot: [5, 5], b: [1, 1], cy: 200 },
  thread: { S: 24, plot: [5, 5], b: [1, 1], cy: 196 },
  'mnu-sms': { S: 20, plot: [5.6, 6.4], b: [1, 0.6], cy: 196 },
  printer: { S: 25, plot: [5, 5], b: [1, 1], cy: 200 },
  yosr: { S: 18.5, plot: [6.4, 6.4], b: [1.2, 1.0], cy: 196 },
};
export const hasRig = key => key in RIG;
export const rigFor = (key, big) => RIG[key] || (big ? { S: 30, plot: [6, 6], b: [1.5, 1.5], cy: 300 } : { S: 24, plot: [5, 5], b: [1, 1], cy: 205 });

export function wrap(text, max) {
  const out = []; let line = '';
  for (const w of text.split(' ')) { if ((line + ' ' + w).trim().length > max) { out.push(line.trim()); line = w; } else line += ' ' + w; }
  if (line.trim()) out.push(line.trim());
  return out;
}
// Wrap to at most `rows` lines of mono text; an overflowing last line ends in an ellipsis at a word.
export function wrapFit(text, maxW, size, ls, rows) {
  const lines = wrap(text, Math.floor((maxW + ls) / (0.6 * size + ls)));
  if (lines.length <= rows) return lines;
  const keep = lines.slice(0, rows);
  keep[rows - 1] = ellipsize(lines.slice(rows - 1).join(' '), maxW - monoW('…', size, ls), size, ls).replace(/…?$/, '…');
  return keep;
}

// Display names shrink so they never leave the card.
export const fitSize = (text, maxW, base, ls = 1) => Math.min(base, (base * maxW) / displayWidth(text, base, ls));
export const linkLabel = url => (url.includes('github.com') ? 'VIEW THE REPO' : url.includes('/work/') ? 'READ THE CASE STUDY' : 'VISIT THE SITE');

// Plot of land with the same strata as the hero diorama, building + props on top.
export function scene(project, cx, data, { big = false, clockTime, litFrac = 0.6, extra, rig: rigOverride } = {}) {
  const key = project.key, rig = rigOverride || rigFor(key, big), { S, plot: [w, d], b, cy } = rig;
  const C = 0.866, ox = cx - (w / 2 - d / 2) * C * S, oy = cy - (w / 2 + d / 2) * 0.5 * S;
  const I = iso(ox, oy, S, key.replace(/[^a-z]/g, '') || 'p');
  let s = I.box(0, 0, -1.2, w, d, 0.55, '#24173a', { top: false }) + I.box(0, 0, -0.65, w, d, 0.65, '#4c2f62', { top: false });
  s += I.topFace(0, 0, 0, w, d, '#43305f');
  s += `<g transform="${I.mTop(0, 0, 0)}" opacity=".25">` + Array.from({ length: Math.floor(w) }, (_, i) => `<line x1="${i + 1}" y1="0" x2="${i + 1}" y2="${d}" stroke="#8a72b8" stroke-width=".02"/>`).join('')
    + Array.from({ length: Math.floor(d) }, (_, i) => `<line x1="0" y1="${i + 1}" x2="${w}" y2="${i + 1}" stroke="#8a72b8" stroke-width=".02"/>`).join('') + '</g>';
  s += I.topFace(0, d - 0.55, 0.01, w, 0.55, '#2a2046') + I.topFace(w - 0.55, 0, 0.012, 0.55, d - 0.55, '#2a2046');
  s += tree(I, 0.55, d - 1.1, 0.9);
  const draw = DRAW[key] || (/in design|in progress/i.test(project.kind) ? yosr : null);
  const r = draw ? draw(I, b[0], b[1], key === 'attendance' ? clockTime : {}) : townhouse(I, b[0], b[1], townhouseSpec(project, data));
  s += r.svg;
  s += lamp(I, w - 0.3, d - 0.3) + (key === 'dose' || key === 'thread' ? palm(I, w - 0.6, 0.9, 2.6) : tree(I, w - 1.0, d - 1.05, 0.8));
  const total = (s.match(/fill="%W%"/g) || []).length;
  const lit = lightUp(s, Math.round(total * litFrac), key);
  return { svg: lit.svg + (extra ? extra(I, b) : ''), defs: I.defs, pin: r.pin, I };
}

export const SHARED_DEFS = `
<radialGradient id="beaconGlow"><stop offset="0" stop-color="#bff8ff" stop-opacity=".9"/><stop offset="1" stop-color="#6fe3e1" stop-opacity="0"/></radialGradient>
<linearGradient id="beamGrad"><stop offset="0" stop-color="#d6fbff" stop-opacity=".5"/><stop offset="1" stop-color="#6fe3e1" stop-opacity="0"/></linearGradient>
<radialGradient id="lampGlow"><stop offset="0" stop-color="#ffd58a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd58a" stop-opacity="0"/></radialGradient>`;

// Recency of the repo drives how lit the building is tonight.
export function liveFor(project, data) {
  const repo = (data.repos || []).find(r => project.repo && r.name.toLowerCase() === project.repo.toLowerCase());
  if (!repo) return { repo: null, litFrac: 0.45 };
  const days = daysSince(repo.pushedAt, data.generatedAt);
  return { repo, litFrac: Math.max(0.18, Math.min(0.92, 0.92 - days / 160)), when: ago(repo.pushedAt, data.generatedAt) };
}

export function cta(x, y, label, anchor = 'start') {
  const w = monoW(label, 13, 1.6) + 72, x0 = anchor === 'end' ? x - w : x;
  return `<g transform="translate(${f(x0)},${y})"><rect width="${f(w)}" height="38" rx="19" fill="${PAL.coral}"/>`
    + `<text x="20" y="24.5" class="m" font-size="13" fill="#2a0f24" letter-spacing="1.6">${esc(label)}</text>`
    + `<path d="M${f(w - 28)} 24 l9 -9 M${f(w - 26)} 15 h7 v7" stroke="#2a0f24" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
}

export function frameBg(w, h, glowX, glowY, id) {
  return `<clipPath id="fr${id}"><rect width="${w}" height="${h}" rx="24"/></clipPath>`
    + `<linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#160d33"/><stop offset=".65" stop-color="#2a1550"/><stop offset="1" stop-color="#4a2160"/></linearGradient>`
    + `<radialGradient id="gl${id}" cx="${glowX}" cy="${glowY}" r=".5"><stop offset="0" stop-color="#ff8a6b" stop-opacity=".42"/><stop offset=".6" stop-color="#b4486a" stop-opacity=".12"/><stop offset="1" stop-color="#b4486a" stop-opacity="0"/></radialGradient>`;
}
