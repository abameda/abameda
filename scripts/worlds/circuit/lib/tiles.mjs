// Half-width tiles for the smaller projects. Side 'L' sits under the left bus, 'R' under the right
// one (x shifted by 600). Each tile carries a different small package; the mobile variant keeps
// the geometry but sets the name large enough to read at a quarter of the screen.
import { C, doc, text, fit, fitLines, tw, board, via, pad, trace, pulse, busLines, BUS, BLOCK, blockSides, rng } from './svg.mjs';
import { qfp, soic } from './parts.mjs';
import { qfn, sot, marking, pin1 } from './pkg.mjs';
import { branch, netFlag, linkLabel, repoOf, liveLine, host } from './projects.mjs';

export const TILE_PKGS = ['qfn', 'qfp', 'tssop', 'sot'];
const dashedBox = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${C.silk2}" stroke-dasharray="5 5" opacity=".6"/>`;

function smallPart(kind, px, py, box, side, m) {
  let g = '', land;
  const mark = (cx, cy, w) => text(cx, cy, m.pn, { size: Math.min(13, fit(m.pn, w, 13, 'D')), font: 'D', anchor: 'middle', fill: '#9C9686' });
  if (kind === 'tssop') {
    const q = soic({ x: px, y: py + 26, w: box, h: 40, n: 6, len: 10, pw: 6, inset: 10 });
    g = q.svg + mark(px + box / 2, py + 51, box - 22) + pin1(px + 10, py + 56, m.color, 3.5);
    const pin = side === 'L' ? q.pins.T[0] : q.pins.T[5]; land = { x: pin.x, y: pin.y, vert: true };
  } else if (kind === 'sot') {
    const s = sot({ x: px + 8, y: py + 30, w: box - 16, h: 40 });
    g = s.svg + mark(px + box / 2, py + 55, box - 30) + pin1(px + 18, py + 40, m.color, 3.5);
    land = { x: s.tab.x, y: s.tab.y, vert: true };
  } else if (kind === 'qfn') {
    const q = qfn({ x: px + 10, y: py + 10, w: box - 20, h: box - 20, n: 5 });
    g = q.svg + mark(px + box / 2, py + box / 2 + 5, box - 34) + pin1(px + 22, py + 22, m.color, 3.5);
    land = side === 'L' ? q.pins.L[2] : q.pins.R[2];
  } else {
    const q = qfp({ x: px + 14, y: py + 14, w: box - 28, h: box - 28, n: [4, 4, 4, 4], len: 10, pw: 6, inset: 13, id: 'tq', sheen: false });
    q.pins.T.forEach((pp, i) => { if (i % 2) g += trace(`M${pp.x} ${pp.y}V${pp.y - 8}`, 2) + via(pp.x, pp.y - 11, 3); });
    g += q.svg + mark(px + box / 2, py + box / 2 + 5, box - 38) + pin1(px + 23, py + 23, m.color, 3.5);
    land = side === 'L' ? q.pins.L[1] : q.pins.R[2];
  }
  return { g, land };
}

export function tile(p, ref, D, side, seed, { G = 0, dnp = false, net, refOf = {}, pkg = 'qfp', last = false, mobile = false } = {}) {
  const W = 600, H0 = mobile ? 300 : 276, H = H0 + (last ? 44 : 0); const R = rng(seed);
  const repo = p && repoOf(p, D);
  const bx = side === 'L' ? BUS.L : BUS.R.map(x => x - 600);
  const blockX = side === 'L' ? BLOCK.L : BLOCK.R - 600;
  const x0 = side === 'L' ? 108 : 44, x1 = side === 'L' ? 556 : 492;
  const box = 92, px = side === 'L' ? x0 : x1 - box, py = 24;
  let g = board(W, H) + busLines(H, { side, dx: side === 'R' ? -600 : 0, G }) + blockSides(0, last ? H - 22 : H, [blockX]);
  if (last) g += `<path d="M${side === 'L' ? blockX : 0} ${H - 22}H${side === 'L' ? 600 : blockX}" fill="none" stroke="${C.silk2}" stroke-width="1.4" stroke-dasharray="7 6" opacity=".5"/>`;
  let cur = '';
  if (dnp) {
    for (let i = 0; i < 4; i++) for (const [dx, dy, w, h] of [[-12, 14 + i * 16, 10, 7], [box - 34 + 2, 14 + i * 16, 10, 7], [14 + i * 16, -12, 7, 10], [14 + i * 16, box - 34 + 2, 7, 10]]) g += pad(px + 17 + dx, py + 17 + dy, w, h, 1);
    g += dashedBox(px + 3, py + 3, box - 6, box - 6);
  } else {
    const m = marking(p, repo);
    const sp = smallPart(pkg, px, py, box, side, m);
    const br = branch(sp.land, side === 'L' ? bx[2] : bx[0], sp.land.vert ? py - 8 : sp.land.y);
    g += br.svg + sp.g;
    cur = pulse(br.r, { phase: R() * 0.8, speed: 110, dash: 20 });
  }
  const tx = side === 'L' ? px + box + 22 : x0, txMax = side === 'L' ? x1 : px - 22;
  const name = dnp ? 'RESERVED' : p.name;
  const link = dnp ? 'ALL REPOS' : linkLabel(p.url, x1 - x0 - 300, 16);

  if (mobile) {
    g += text(tx, 74, ref, { size: 34, ls: 2, fill: C.gold });
    const nm = fitLines(name, x1 - x0, 60, 2, { font: 'D', min: 34 });
    const y0 = nm.lines.length > 1 ? 170 : 196;
    nm.lines.forEach((ln, i) => (g += text(x0, y0 + i * (nm.size + 8), ln, { size: nm.size, font: 'D', fill: dnp ? C.dim : C.silk })));
    const ml = `↗ ${dnp ? link : host(p.url).split('/')[0]}`;
    g += text(x0, H0 - 26, ml, { size: Math.min(32, fit(ml, x1 - x0, 32, 'M', 1)), ls: 1, fill: C.gold });
  } else {
    g += text(tx, 56, ref, { size: 18, ls: 2, fill: C.gold });
    const live = dnp ? `${Number(D.publicRepos || 0).toLocaleString('en-US')} PUBLIC REPOS` : liveLine(repo, D.ref);
    const lx = tx + tw(ref, 18, 'M', 2) + 16;
    if (!dnp && repo) g += `<circle cx="${lx + 4}" cy="50" r="4" fill="${C.sig}" class="blink"/>`;
    const lx2 = lx + (!dnp && repo ? 16 : 0);
    g += text(lx2, 56, live, { size: Math.min(16, fit(live, txMax - lx2, 16, 'M', 1.2)), ls: 1.2, fill: C.dim });
    const kind = dnp ? 'DNP · DO NOT POPULATE (YET)' : p.kind.toUpperCase();
    const kd = fitLines(kind, txMax - tx, 16, 1, { font: 'M', min: 13, ls: 1.2 });
    g += text(tx, 84, kd.lines[0], { size: kd.size, ls: 1.2, fill: C.dim });
    if (net) g += netFlag(tx, 114, `NET ${net.name} ↔ ${net.others.map(k => refOf[k]).filter(Boolean).join(' ')}`, { size: 15 });
    g += text(x0, 168, name, { size: fit(name, x1 - x0, 32), font: 'D', fill: dnp ? C.dim : C.silk });
    const line = dnp ? 'Footprint left open for the next build. Until then, every repository is one click away.' : p.line;
    const ds = fitLines(line, x1 - x0, 18, 2, { min: 16 });
    ds.lines.forEach((ln, i) => (g += text(x0, 202 + i * 24, ln, { size: ds.size, font: 'B', fill: dnp ? C.dim : C.silk2 })));
    const lab = `↗ ${dnp ? link : linkLabel(p.url, x1 - x0 - 120, 16)}`, lw = tw(lab, 16, 'M', 1);
    g += text(x1, H0 - 18, lab, { size: 16, ls: 1, fill: C.gold, anchor: 'end' });
    let sx = x0;
    for (const it of dnp ? [] : p.stack || []) {
      const s = String(it).toUpperCase(), w = tw(s, 15, 'M', 1.2);
      if (sx + w + 14 > x1 - lw - 24) break;
      g += pad(sx, H0 - 32, 7, 15, 1.2) + text(sx + 14, H0 - 18, s, { size: 15, ls: 1.2, fill: C.silk2 }); sx += w + 36;
    }
  }
  const t = dnp ? `${ref} reserved: next build` : `${ref} ${p.name}: ${p.kind}`;
  return doc({ w: W, h: H, title: t, desc: dnp ? 'An empty footprint reserved for the next project. Links to all repositories.' : `${p.line}`, body: g + cur });
}
