// Portrait mobile variants (600 wide, shown full width under 600px: about 0.57x on a phone).
// Same world, re-composed: the bus sits at half the page x (k = 2) so it still lines up with the
// desktop-geometry slices around it, and every readable line is 18-30 units (10-17 px).
import { C, doc, text, fit, fitLines, tw, board, via, trace, flow, pulse, chamfer, busLines, busX, BUS_PHASE, BLOCK, blockTop, blockSides, blockBottom, rng, pad } from './svg.mjs';
import { qfp, led, SHEEN_CSS } from './parts.mjs';
import { decap, DIE_CSS } from './die.mjs';
import { facts, lastPush, FACT_CSS } from './hero.mjs';
import { part, PKG, repoOf, liveLine, linkLabel, branch } from './projects.mjs';
export { bomM, scopeM } from './mobile2.mjs';

const K = 2, W = 600, BX = busX(K), BL = BLOCK.L / K, BR = BLOCK.R / K;

export function heroM(profile, D, G = 0) {
  const PK = { x: 56, y: 150, w: 488, h: 300 };
  const cav = { x: PK.x + 16, y: PK.y + 16, w: PK.w - 32, h: PK.h - 32 };
  const die = { x: cav.x + 20, y: cav.y + 24, w: cav.w - 40, h: cav.h - 48 };
  const q = qfp({ ...PK, n: [6, 6, 14, 14], len: 12, pw: 6, inset: 26, id: 'u1', sheen: false });
  const F = facts(profile, D), n = F.length;
  const ch = Array.from({ length: n }, (_, j) => 46 + j * 4.5), padX = 46 + n * 4.5 + 12, lx = padX + 14, vx = lx + 84;
  const pinY = PK.y + PK.h + 12, y0 = pinY + 14 + n * 4.5 + 34;
  const rows = []; let y = y0;
  F.forEach(([k, v]) => { const f = fitLines(v, 552 - vx, 26, 3, { min: 22 }); rows.push({ k, ...f, y }); y += 14 + f.lines.length * 32 + 16; });
  const st = lastPush(D), H = y + (st.sub ? 118 : 90);

  let out = board(W, H, { rt: 10 });
  out += text(48, 48, `${profile.login.toUpperCase()} / MAINBOARD`, { size: 22, ls: 2, fill: C.silk });
  out += text(48, 78, `REV ${D.rev} · LIVE DATA`, { size: 19, ls: 1.2, fill: C.dim });
  out += blockTop(112, BL, BR, '01', 'CPU', '', { k: K, size: 19 }) + blockSides(112, H - 20, [BL, BR], K) + blockBottom(H - 20, BL, BR, K);
  const busR = [];
  [['L', [1, 2, 3]], ['R', [1, 2, 3]]].forEach(([s, idx]) => idx.forEach((pi, j) => {
    const p = q.pins[s][pi], bx = s === 'L' ? BX.L[j] : BX.R[2 - j];
    const r = chamfer([[p.x, p.y], [bx, p.y], [bx, H]], 6); busR.push({ r, line: s === 'L' ? j : 5 - j });
    out += trace(r.d, 1.7);
  }));
  q.pins.T.forEach((p, i) => { if (i % 2 === 0) out += trace(`M${p.x} ${p.y}V${p.y - 10}`, 1.4) + via(p.x, p.y - 13, 2.4); });
  const first = q.pins.B.findIndex(p => p.x > ch[n - 1] + 12), fan = [];
  rows.forEach((r, i) => {
    const j = n - 1 - i, p = q.pins.B[first + j], yh = pinY + 14 + j * 4.5;
    const rt = chamfer([[p.x, p.y], [p.x, yh], [ch[j], yh], [ch[j], r.y - 7], [padX, r.y - 7]], 5);
    fan.push(rt); out += trace(rt.d, 1.4) + via(padX, r.y - 7, 4);
    out += text(lx, r.y, r.k, { size: 17, ls: 1.6, fill: C.gold });
    r.lines.forEach((ln, l) => (out += text(vx, r.y + l * 32, ln, { size: r.size, font: 'B', fill: C.silk })));
  });
  const dc = decap(cav, die, { nT: 14, nS: 4, id: 'u1d', k: K });
  out += q.svg + dc.svg;
  const names = [profile.firstName, profile.lastName].map(s => String(s || '').toUpperCase());
  const s = Math.floor(fit(names.reduce((a, b) => (tw(a, 1, 'D') > tw(b, 1, 'D') ? a : b)), die.w - 34, 64, 'D'));
  out += `<linearGradient id="nm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D9D2C2"/></linearGradient>`;
  out += text(die.x + 18, die.y + 32, profile.login.toUpperCase(), { size: 15, ls: 3, fill: '#9AA0C4' }) + text(die.x + die.w - 18, die.y + 32, 'U1', { size: 15, ls: 3, fill: '#9AA0C4', anchor: 'end' });
  const b1 = die.y + 100, b2 = b1 + s + 4;
  [[names[0], b1], [names[1], b2]].forEach(([nm, by]) => (out += text(301, by + 1.5, nm, { size: s, font: 'D', anchor: 'middle', fill: '#000', op: 0.55 }) + text(300, by, nm, { size: s, font: 'D', anchor: 'middle', fill: 'url(#nm)' })));
  out += text(300, b2 + 40, String(profile.identity?.[0] || '').toUpperCase(), { size: 18, ls: 3.5, fill: C.gold, anchor: 'middle' });
  const sy = y + 26;
  out += `<path d="M${BL + 20} ${sy - 30}H${BR - 20}" stroke="${C.silk2}" stroke-opacity=".2"/>`;
  out += led(78, sy - 7, { label: false }) + text(104, sy, st.head, { size: 22, ls: 1.6, fill: C.silk });
  if (st.sub) out += text(104, sy + 32, st.sub, { size: 18, ls: 1.2, fill: C.dim });
  let cur = dc.overlay;
  busR.forEach(({ r, line }) => (cur += flow(r, (G + BUS_PHASE[line]) / K + H - r.len, { k: K, w: 1.3 })));
  fan.forEach((r, i) => (cur += `<path class="fg" d="${r.d}" fill="none" stroke="${C.sig}" stroke-width="1.8" style="animation-delay:${(i * 0.35).toFixed(2)}s"/>`));
  return doc({ w: W, h: H, k: K, title: `${profile.name}: ${profile.role} at ${profile.company}`, desc: `Mobile layout of the decapped U1 chip etched with ${profile.name}, and its pin assignment: ${F.map(f => f[1]).join('; ')}.`, css: DIE_CSS + FACT_CSS, body: out + cur });
}

export function featuredM(p, ref, D, seed, { G = 0, first = false, nParts = 0 } = {}) {
  const T = first ? 54 : 0, R = rng(seed), repo = repoOf(p, D);
  const x0 = 56, x1 = 544, sc = 0.6, cx = 300, cy = T + 128;
  const pt = part(PKG[p.key] || 'qfp', 0, 0, p, repo, 'L');
  const land = { x: cx + pt.land.x * sc, y: cy + pt.land.y * sc, vert: pt.land.vert };
  const br = branch(land, BX.L[2], land.vert ? T + 26 : land.y);
  const kind = fitLines(p.kind.toUpperCase(), x1 - x0, 18, 2, { font: 'M', min: 15, ls: 1.2 });
  const ds = fitLines(p.line, x1 - x0, 28, 5, { min: 24 });
  const yK = T + 262, yN = yK + kind.lines.length * 26 + 44, yD = yN + 46;
  const yS = yD + ds.lines.length * 36 + 22, yL = yS + 44, H = yL + 76;
  let g = board(W, H) + busLines(H, { G, k: K }) + blockSides(first ? 26 : 0, H, [BL, BR], K);
  if (first) g += blockTop(26, BL, BR, '02', 'PARTS', `${nParts} PARTS · ALL LINKED`, { k: K, size: 17 });
  g += br.svg.replace(/stroke-width="3"/, 'stroke-width="1.8"') + `<g transform="translate(${cx} ${cy}) scale(${sc})">${pt.g}</g>`;
  g += text(x0, yK, ref, { size: 20, ls: 2, fill: C.gold });
  kind.lines.forEach((ln, i) => (g += text(x0 + tw(ref, 20, 'M', 2) + 16, yK + i * 26, ln, { size: kind.size, ls: 1.2, fill: C.dim })));
  g += text(x0, yN, p.name, { size: fit(p.name, x1 - x0, 46), font: 'D', fill: C.silk });
  ds.lines.forEach((ln, i) => (g += text(x0, yD + i * 36, ln, { size: ds.size, font: 'B', fill: C.silk2 })));
  let sx = x0;
  for (const st of p.stack || []) { const lb = String(st).toUpperCase(), w = tw(lb, 18, 'M', 1.2); if (sx + w + 20 > x1) break; g += pad(sx, yS - 16, 8, 18, 1.5) + text(sx + 16, yS, lb, { size: 18, ls: 1.2, fill: C.silk }); sx += w + 40; }
  const live = liveLine(repo, D.ref, true);
  g += `<circle cx="${x0 + 5}" cy="${yL - 7}" r="5" fill="${repo ? C.sig : C.faint}" class="${repo ? 'blink' : ''}"/>` + text(x0 + 20, yL, live, { size: Math.min(19, fit(live, x1 - x0 - 20, 19, 'M', 1)), ls: 1, fill: C.dim });
  const lk = '↗ ' + linkLabel(p.url, x1 - x0 - 20, 20);
  g += text(x0, yL + 38, lk, { size: Math.min(20, fit(lk, x1 - x0, 20, 'M', 1)), ls: 1, fill: C.gold });
  const cur = pulse(br.r, { phase: R() * 0.8, speed: 90, dash: 14, w: 1.8 });
  return doc({ w: W, h: H, k: K, title: `${ref} ${p.name}: ${p.kind}`, desc: p.line, css: SHEEN_CSS, body: g + cur });
}
