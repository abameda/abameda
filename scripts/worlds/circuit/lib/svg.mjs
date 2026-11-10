// Shared SVG toolkit for "The Living Circuit": palette, document shell, PCB primitives, current.
import { text, tw, wrap, fit, fitLines, glyphDefs, esc } from './type.mjs';
export { text, tw, wrap, fit, fitLines, esc };

// Matte black mask, ENIG gold, warm silkscreen, one signal colour for current.
export const C = {
  board: '#0A0C0B', board2: '#0F1311', pour: '#121614', edge: '#252C28',
  cu: '#3B3322', cuHi: '#54472A',            // copper under black mask
  gold: '#D4B062', goldHi: '#F4DE9C', goldLo: '#9A7632',
  silk: '#ECE7DA', silk2: '#B9B6AC', dim: '#8C9089', faint: '#454A46',
  sig: '#5FE6FF',
  pkg: '#141716', pkgHi: '#1D211F', pkgEdge: '#2C312E',
};

export const r1 = n => Math.round(n * 10) / 10;

// Deterministic PRNG so builds are reproducible.
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Page-wide current: one dash pattern (period P, dash D, speed V, in 1200-wide page units) flows
// down every bus line of every slice. Each slice offsets the pattern by its global y, so a dash
// leaving the bottom of one image enters the top of the next. k = page units per local unit.
export const FLOW = { P: 1000, D: 70, V: 230 };
const BASE_CSS = k => `
.p{fill:none;stroke-linecap:round;stroke-linejoin:round;animation:run linear infinite}
@keyframes run{from{stroke-dashoffset:150}to{stroke-dashoffset:0}}
.fl{fill:none;stroke-linecap:round;animation:fl ${r1(FLOW.P / FLOW.V)}s linear infinite}
@keyframes fl{from{stroke-dashoffset:0}to{stroke-dashoffset:-${FLOW.P / k}}}
.blink{animation:blink 2.6s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

export function doc({ w, h, title, desc = '', css = '', defs = '', body, k = 1 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>
<style>${BASE_CSS(k)}${css}</style>
<defs>${goldDefs()}${glyphDefs(body)}${defs}</defs>
${body}
</svg>
`;
}

function goldDefs() {
  return `<linearGradient id="au" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.goldHi}"/><stop offset=".45" stop-color="${C.gold}"/><stop offset="1" stop-color="${C.goldLo}"/></linearGradient>
<linearGradient id="auH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.goldLo}"/><stop offset=".5" stop-color="${C.goldHi}"/><stop offset="1" stop-color="${C.goldLo}"/></linearGradient>
<linearGradient id="pkg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1B1F1D"/><stop offset=".55" stop-color="${C.pkg}"/><stop offset="1" stop-color="#0E100F"/></linearGradient>
<pattern id="stitch" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="3.2" fill="none" stroke="${C.cu}" stroke-width="1.6"/></pattern>`;
}

export const silk = (x, y, s, o = {}) => text(x, y, s, { size: 16, ls: 1.5, fill: C.silk2, ...o });

// ---- board ------------------------------------------------------------
// Board slab; rt/rb = corner radius top/bottom so the stacked images read as one board.
export function board(w, h, { rt = 0, rb = 0, x = 0 } = {}) {
  const d = `M${x + rt},0 H${x + w - rt} Q${x + w},0 ${x + w},${rt} V${h - rb} Q${x + w},${h} ${x + w - rb},${h} H${x + rb} Q${x},${h} ${x},${h - rb} V${rt} Q${x},0 ${x + rt},0 Z`;
  return `<path d="${d}" fill="${C.board}"/>`;
}
export function edgeStitch(h, xs = [10, 1190], y0 = 0) {
  return xs.map(x => `<rect x="${x - 11}" y="${y0}" width="22" height="${h - y0}" fill="url(#stitch)" opacity=".55"/>`).join('');
}

export const hole = (x, y) => `<g><circle cx="${x}" cy="${y}" r="17" fill="none" stroke="${C.silk2}" stroke-width="1" stroke-dasharray="2 4" opacity=".5"/><circle cx="${x}" cy="${y}" r="12" fill="url(#au)"/><circle cx="${x}" cy="${y}" r="7.5" fill="#030404"/></g>`;
export const fid = (x, y) => `<g><circle cx="${x}" cy="${y}" r="10" fill="${C.board2}" stroke="${C.faint}" stroke-width=".8"/><circle cx="${x}" cy="${y}" r="4" fill="url(#au)"/></g>`;
export const via = (x, y, r = 4.5) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${C.cuHi}"/><circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r * 0.45)}" fill="#050606"/>`;
export const tp = (x, y, r = 7) => `<g><circle cx="${x}" cy="${y}" r="${r + 4}" fill="none" stroke="${C.silk2}" stroke-width="1" opacity=".55"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#au)"/></g>`;
export const pad = (x, y, w, h, rx = 1.5) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${rx}" fill="url(#au)"/>`;

// Two-terminal SMD part (0603 style): gold end caps, dark body. Designators are ornament only.
export function smd(x, y, { w = 30, h = 14, vertical = false, body = '#1C1A17' } = {}) {
  const [W, H] = vertical ? [h, w] : [w, h]; const cap = (vertical ? H : W) * 0.24;
  const caps = vertical ? pad(x, y, W, cap) + pad(x, y + H - cap, W, cap) : pad(x, y, cap, H) + pad(x + W - cap, y, cap, H);
  const bod = vertical ? `<rect x="${x}" y="${y + cap}" width="${W}" height="${H - 2 * cap}" fill="${body}"/>` : `<rect x="${x + cap}" y="${y}" width="${W - 2 * cap}" height="${H}" fill="${body}"/>`;
  return caps + bod;
}

// ---- traces and current -------------------------------------------------
export function poly(pts) {
  let d = '', len = 0;
  pts.forEach(([x, y], i) => { d += (i ? 'L' : 'M') + r1(x) + ' ' + r1(y); if (i) len += Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]); });
  return { d, len };
}
// Orthogonal route -> 45-degree chamfered corners, the way a PCB router draws them.
export function chamfer(pts, c = 10) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], [nx, ny] = pts[i + 1];
    const l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(nx - bx, ny - by);
    const k = Math.min(c, l1 / 2, l2 / 2);
    out.push([bx - (bx - ax) / l1 * k, by - (by - ay) / l1 * k], [bx + (nx - bx) / l2 * k, by + (ny - by) / l2 * k]);
  }
  out.push(pts[pts.length - 1]);
  return poly(out);
}
export const trace = (d, w = 3, col = C.cu, op) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op ? ` opacity="${op}"` : ''}/>`;

// A local pulse of current along a short path (pathLength=100, period 150: travel 2/3, rest 1/3).
// Clamped so short paths never cycle faster than 2.4 s and the dash never exceeds 25% of the path.
export function pulse(p, { speed = 220, dash = 34, w = 3, phase = 0.3, glow = true, col = C.sig } = {}) {
  const len = Math.max(p.len, 1);
  const d = Math.min(25, (dash / len) * 100);
  const dur = Math.max(2.4, (len / speed) * 1.5);
  const u = phase * (100 - d);
  const st = `stroke-dasharray:${r1(d)} ${r1(150 - d)};stroke-dashoffset:${r1(150 - u)};animation-duration:${r1(dur)}s;animation-delay:-${(u / 150 * dur).toFixed(2)}s`;
  const g = glow ? `<path class="p" d="${p.d}" pathLength="100" stroke="${col}" stroke-width="${r1(w * 3.2)}" opacity=".18" style="${st}"/>` : '';
  return g + `<path class="p" d="${p.d}" pathLength="100" stroke="${col}" stroke-width="${w}" style="${st}"/>`;
}

// Page-synchronised flow along path p. o = pattern position (local units) at the path start.
export function flow(p, o, { k = 1, w = 2.6, glow = true, col = C.sig } = {}) {
  const P = FLOW.P / k, D = FLOW.D / k, T = FLOW.P / FLOW.V;
  const off = ((o % P) + P) % P;
  const st = `stroke-dasharray:${r1(D)} ${r1(P - D)};stroke-dashoffset:${r1(off)};animation-delay:-${(((P - off) % P) / P * T).toFixed(2)}s`;
  const g = glow ? `<path class="fl" d="${p.d}" stroke="${col}" stroke-width="${r1(w * 3.2)}" opacity=".16" style="${st}"/>` : '';
  return g + `<path class="fl" d="${p.d}" stroke="${col}" stroke-width="${w}" style="${st}"/>`;
}

// ---- the system bus ----------------------------------------------------
// Six lines (three per margin) run through every slice at identical page x, so the stacked
// images read as one continuous board. Phases are per line and identical in every slice.
export const BUS = { L: [34, 50, 66], R: [1134, 1150, 1166] };
export const BUS_PHASE = [0, 410, 820, 205, 615, 1025];
export const busX = (k = 1) => ({ L: BUS.L.map(x => x / k), R: BUS.R.map(x => x / k) });
// G = global page y of this slice's top. side 'L'|'R'|'both'; dx shifts x (right tiles: -600).
export function busLines(h, { side = 'both', dx = 0, G = 0, k = 1, y0 = 0, pulses = true } = {}) {
  const X = busX(k); const lines = [];
  if (side !== 'R') X.L.forEach((x, i) => lines.push([x + dx, i]));
  if (side !== 'L') X.R.forEach((x, i) => lines.push([x + dx, i + 3]));
  let out = '';
  for (const [x] of lines) out += trace(`M${x} ${y0}V${h}`, 3.4 / k);
  if (pulses) for (const [x, i] of lines) out += flow(poly([[x, y0], [x, h]]), (G + BUS_PHASE[i]) / k + y0, { k, w: 2.6 / k });
  return out;
}

// ---- functional blocks: dashed silkscreen outlines with a corner tab, as on real boards ----
export const BLOCK = { L: 86, R: 1114 };
const dashed = (d, k = 1) => `<path d="${d}" fill="none" stroke="${C.silk2}" stroke-width="${r1(1.4 / k)}" stroke-dasharray="${r1(7 / k)} ${r1(6 / k)}" opacity=".5"/>`;
export const blockSides = (y0, y1, xs = [BLOCK.L, BLOCK.R], k = 1) => xs.map(x => dashed(`M${x} ${y0}V${y1}`, k)).join('');
export function blockTop(y, x0, x1, no, title, note = '', { k = 1, size = 17 } = {}) {
  const tab = `BLOCK ${no}`, tW = tw(tab, size, 'M', 2) + 24 / k, th = size + 14 / k;
  const gap = size * 0.8, tX1 = x0 + tW + gap + tw(title, size + 2, 'M', 2.4) + gap;
  const nW = note ? tw(note, size - 1, 'M', 1.4) + 32 / k : 0;
  let g = dashed(`M${tX1} ${y}H${x1 - nW}`, k);
  g += `<rect x="${x0}" y="${r1(y - th / 2)}" width="${r1(tW)}" height="${r1(th)}" rx="${r1(2 / k)}" fill="${C.silk2}"/>`;
  g += text(x0 + 12 / k, y + size * 0.36, tab, { size, ls: 2, fill: C.board });
  g += text(x0 + tW + gap, y + size * 0.36, title, { size: size + 2, ls: 2.4, fill: C.silk });
  if (note) g += text(x1 - 16 / k, y + size * 0.36, note, { size: size - 1, ls: 1.4, fill: C.dim, anchor: 'end' });
  return g;
}
export const blockBottom = (y, x0, x1, k = 1) => dashed(`M${x0} ${y - 40 / k}V${y}H${x1}V${y - 40 / k}`, k);
