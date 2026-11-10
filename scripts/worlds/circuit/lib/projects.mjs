// Projects: every project is a part placed on the board and wired to the system bus.
// Featured parts are full-width slices; the rest are half-width tiles. One linked SVG each.
import { C, doc, text, fit, fitLines, tw, board, via, pad, trace, pulse, chamfer, busLines, BUS, BLOCK, blockTop, blockSides, rng } from './svg.mjs';
import { qfp, soic, shield, SHEEN_CSS } from './parts.mjs';
import { bga, qfn, sot, marking, etch, pin1 } from './pkg.mjs';
import { ago } from './data.mjs';

export const PKG = { cortex: 'qfp', dose: 'shield', attendance: 'soic', bosla: 'bga' };
export const host = url => String(url).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').replace(/\.html$/, '');
// Honest link label: full path if it fits, github repos by name, otherwise the bare domain.
export const linkLabel = (url, room, size) => {
  const h = host(url); const gh = h.match(/^github\.com\/[^/]+\/(.+)$/);
  const full = gh ? `github/${gh[1]}` : h;
  return tw('↗ ' + full, size, 'M', 1) <= room ? full : h.split('/')[0];
};
export const repoOf = (p, D) => D.byName[String(p?.repo || '').toLowerCase()];
export const liveLine = (repo, ref, long) => repo?.pushedAt ? `${long ? 'LAST FLASHED' : 'FLASHED'} ${ago(repo.pushedAt, ref)}` : 'NO PUBLIC REPO DATA';

// Nets: projects whose names share a first word are wired together (CORTEX + CORTEX OPS, AMWAG ...).
export function nets(projects) {
  const by = {};
  for (const p of projects) { const w = String(p.name).split(/\s+/)[0].toUpperCase(); (by[w] ||= []).push(p.key); }
  const out = {};
  for (const [w, keys] of Object.entries(by)) if (keys.length > 1) keys.forEach(k => (out[k] = { name: w, others: keys.filter(x => x !== k) }));
  return out;
}
// Off-page connector flag (schematic style), left edge at x, centred on y.
export function netFlag(x, y, label, { size = 16, anchor = 'start' } = {}) {
  const w = tw(label, size, 'M', 1.4) + 34, h = size + 14; const x0 = anchor === 'middle' ? x - w / 2 : x;
  return `<path d="M${x0} ${y - h / 2}H${x0 + w - 12}L${x0 + w} ${y}L${x0 + w - 12} ${y + h / 2}H${x0}Z" fill="${C.board2}" stroke="${C.silk2}" stroke-width="1.3" opacity=".9"/>` + text(x0 + 12, y + size * 0.36, label, { size, ls: 1.4, fill: C.silk2 });
}

// Package + marking at (cx, cy). Returns svg, the land point for the bus branch and the bottom y.
function part(kind, cx, cy, p, repo, side) {
  const m = marking(p, repo); let g = '', land, bot;
  if (kind === 'shield') {
    const w = 270, h = 190; g = shield({ x: cx - w / 2, y: cy - h / 2, w, h, id: 'can' }).svg;
    const s = Math.floor(fit(p.name, w - 70, 44, 'D'));
    g += text(cx, cy + 2, p.name, { size: s, font: 'D', anchor: 'middle', fill: '#FBEFC6', op: 0.55 }) + text(cx, cy, p.name, { size: s, font: 'D', anchor: 'middle', fill: '#3E2E0C' });
    g += text(cx, cy + 32, `${m.pn} · ${m.lang}`, { size: 14, ls: 1.4, anchor: 'middle', fill: '#4E3B14' });
    if (m.fw) g += text(cx, cy + 54, m.fw, { size: 13, ls: 1.2, anchor: 'middle', fill: '#4E3B14' });
    land = { x: side === 'L' ? cx - w / 2 - 8 : cx + w / 2 + 8, y: cy }; bot = cy + h / 2 + 10;
  } else if (kind === 'soic') {
    const w = 290, h = 118; const q = soic({ x: cx - w / 2, y: cy - h / 2, w, h, n: 12 });
    q.pins.B.forEach((pp, i) => { if (i % 2 === 0) g += trace(`M${pp.x} ${pp.y}V${pp.y + 12}`, 2.2) + via(pp.x, pp.y + 16, 3.4); });
    g += q.svg + etch(cx + 14, cy - 2, w - 60, m, { logo: false, big: 24 }) + pin1(cx - w / 2 + 22, cy + h / 2 - 20, m.color, 5);
    const pin = side === 'L' ? q.pins.T[0] : q.pins.T[q.pins.T.length - 1];
    land = { x: pin.x, y: pin.y, vert: true }; bot = cy + h / 2 + 34;
  } else if (kind === 'bga') {
    const w = 216; const b = bga({ x: cx - w / 2, y: cy - w / 2, w, h: w, id: 'bga' });
    g = b.svg + etch(cx, cy + 6, b.lid.w, m, { ink: '#2A2D2C', dim: '#4C504E', big: 24 });
    land = { x: side === 'L' ? cx - w / 2 - 8 : cx + w / 2 + 8, y: cy }; bot = cy + w / 2 + 8;
  } else {
    const w = 206; const q = qfp({ x: cx - w / 2, y: cy - w / 2, w, h: w, n: [8, 8, 8, 8], len: 16, pw: 8, inset: 26, id: 'pk' });
    const other = side === 'L' ? q.pins.R : q.pins.L;
    other.forEach((pp, i) => { if (i % 2) g += trace(`M${pp.x} ${pp.y}H${pp.x + (side === 'L' ? 12 : -12)}`, 2.2) + via(pp.x + (side === 'L' ? 16 : -16), pp.y, 3.2); });
    q.pins.T.forEach((pp, i) => { if (i % 3 === 0) g += trace(`M${pp.x} ${pp.y}V${pp.y - 10}`, 2.2) + via(pp.x, pp.y - 14, 3.2); });
    g += q.svg + etch(cx, cy + 8, w, m) + pin1(cx - w / 2 + 26, cy - w / 2 + 26, m.color);
    const pins = side === 'L' ? q.pins.L : q.pins.R;
    land = pins[Math.floor(pins.length / 2)]; bot = cy + w / 2 + 16;
  }
  return { g, land, bot };
}

// Branch from a bus line into the part: T-junction via on the bus, chamfered route.
export function branch(land, busX, yBus) {
  const pts = land.vert ? [[busX, yBus], [land.x, yBus], [land.x, land.y]] : [[busX, land.y], [land.x, land.y]];
  const r = chamfer(pts, 12);
  return { r, svg: trace(r.d, 3) + via(busX, pts[0][1], 6) };
}

function pinRow(x, y, items, maxX, size = 16) {
  let g = '', cx = x;
  for (const it of items) {
    const label = String(it).toUpperCase(), w = tw(label, size, 'M', 1.5);
    if (cx + w + 22 > maxX) break;
    g += pad(cx, y - size + 2, 9, size, 1.5) + text(cx + 18, y, label, { size, ls: 1.5, fill: C.silk });
    cx += w + 50;
  }
  return g;
}

export function featured(p, ref, D, side, seed, { G = 0, first = false, net, refOf = {}, nParts = 0 } = {}) {
  const T = first ? 64 : 0, W = 1200, H = 318 + T; const R = rng(seed);
  const repo = repoOf(p, D);
  const cx = side === 'L' ? 262 : 938, cy = T + 160;
  const pt = part(PKG[p.key] || 'qfp', cx, cy, p, repo, side);
  const busX = side === 'L' ? BUS.L[2] : BUS.R[0];
  const br = branch(pt.land, busX, pt.land.vert ? T + 40 : pt.land.y);
  const x0 = side === 'L' ? 440 : 112, x1 = side === 'L' ? 1098 : 770;

  let g = board(W, H) + busLines(H, { G }) + blockSides(first ? 34 : 0, H);
  if (first) g += blockTop(34, BLOCK.L, BLOCK.R, '02', 'PLACED PARTS', `${nParts} PARTS · EVERY PART IS A LINK`);
  g += br.svg + pt.g;
  if (net) {
    const label = `NET ${net.name} ↔ ${net.others.map(k => refOf[k]).filter(Boolean).join(' ')}`;
    g += trace(`M${cx} ${pt.bot}V${T + 280}`, 2.4) + netFlag(cx, T + 294, label, { anchor: 'middle' });
  }
  g += text(x0, T + 56, ref, { size: 18, ls: 2, fill: C.gold });
  const kx = x0 + tw(ref, 18, 'M', 2) + 18;
  g += text(kx, T + 56, p.kind.toUpperCase(), { size: Math.min(16, fit(p.kind.toUpperCase(), x1 - kx, 16, 'M', 1.4)), ls: 1.4, fill: C.dim });
  g += text(x0, T + 112, p.name, { size: fit(p.name, x1 - x0, 46), font: 'D', fill: C.silk });
  const ds = fitLines(p.line, x1 - x0, 22, 3, { min: 19 });
  ds.lines.forEach((ln, i) => (g += text(x0, T + 154 + i * 29, ln, { size: ds.size, font: 'B', fill: C.silk2 })));
  g += pinRow(x0, T + 254, p.stack || [], x1);
  // live line left, link right: shrink the link first, then shorten the live wording
  let live = liveLine(repo, D.ref, true), lab, ls;
  const lay = () => { const room = x1 - x0 - tw(live, 16, 'M', 1.4) - 52; lab = linkLabel(p.url, room, 16); ls = Math.min(16, fit('↗ ' + lab, room, 16, 'M', 1)); };
  lay(); if (ls < 14 && repo) { live = liveLine(repo, D.ref, false); lay(); }
  g += `<circle cx="${x0 + 5}" cy="${T + 287}" r="5" fill="${repo ? C.sig : C.faint}" class="${repo ? 'blink' : ''}"/>` + text(x0 + 20, T + 293, live, { size: 16, ls: 1.4, fill: C.dim });
  g += text(x1, T + 293, `↗ ${lab}`, { size: ls, ls: 1, fill: C.gold, anchor: 'end' });
  const cur = pulse(br.r, { phase: R() * 0.8, speed: 150, dash: 26 });
  return doc({ w: W, h: H, title: `${ref} ${p.name}: ${p.kind}`, desc: `${p.line} Built with ${(p.stack || []).join(', ')}. ${live.toLowerCase()}. Opens ${host(p.url)}.`, css: SHEEN_CSS, body: g + cur });
}

export { part };
