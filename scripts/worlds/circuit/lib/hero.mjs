// Hero: the top of the board. U1 is decapped: his name is etched on the silicon die, bond wires
// fan out to the lead frame, and the bottom pins break out his real facts (profile.json).
import { C, doc, text, fit, fitLines, tw, board, hole, fid, via, trace, flow, chamfer, edgeStitch, BUS, BUS_PHASE, blockTop, blockSides, blockBottom, BLOCK } from './svg.mjs';
import { qfp, led, crystal } from './parts.mjs';
import { decap, DIE_CSS } from './die.mjs';
import { ago, humanDate } from './data.mjs';

// The pin assignment: one row per fact, in profile.json order. Empty facts are dropped.
export function facts(profile, D) {
  const id = profile.identity || [];
  return [
    ['ROLE', [profile.role, profile.company].filter(Boolean).join(' at ')],
    ['PREV', profile.previousRole],
    ['EDU', profile.education],
    ['BASE', profile.location],
    ...id.slice(1).map((v, i) => [`GPIO${i + 1}`, v]),
    ['GIT', D.joined ? `On GitHub since ${String(D.joined).slice(0, 4)}` : ''],
  ].filter(r => r[1]);
}

// Live status line: the most recent push across public repos.
export function lastPush(D) {
  const r = D.latestRepo;
  return r?.pushedAt ? { head: `LAST PUSH ${ago(r.pushedAt, D.ref)}`, sub: `${r.name.toUpperCase()} · ${humanDate(r.pushedAt)}` } : { head: 'NO PUSHES YET', sub: '' };
}

export const FACT_CSS = `.fg{opacity:0;animation:fg 6.5s ease-in-out infinite}
@keyframes fg{0%{opacity:0}10%{opacity:.9}38%{opacity:0}100%{opacity:0}}
.breathe{animation:breathe 7s ease-in-out infinite}@keyframes breathe{50%{opacity:.5}}`;

export function hero(profile, D) {
  const W = 1200;
  const PK = { x: 128, y: 176, w: 944, h: 452 };
  const cav = { x: PK.x + 46, y: PK.y + 46, w: PK.w - 92, h: PK.h - 92 };
  const die = { x: cav.x + 38, y: cav.y + 40, w: cav.w - 76, h: cav.h - 80 };
  const q = qfp({ ...PK, n: [10, 10, 26, 26], len: 20, pw: 9, inset: 40, id: 'u1', sheen: false });

  // --- fact rows: two columns, rows aligned across columns
  const F = facts(profile, D);
  const nL = Math.ceil(F.length / 2), nR = F.length - nL;
  const col = (n, cx0, x1) => { const pad = cx0 + n * 14 + 12; return { ch: Array.from({ length: n }, (_, j) => cx0 + j * 14), pad, tx: pad + 22, x1 }; };
  const cols = [col(nL, 100, 580), col(nR, 612, 1100)];
  const cells = F.map(([k, v], i) => {
    const c = cols[i < nL ? 0 : 1];
    return { k, c, ...fitLines(v, c.x1 - c.tx, 24, 2, { min: 21 }) };
  });
  const rowsN = nL, yRow = [], hRow = [];
  let y = PK.y + PK.h + 124;
  for (let r = 0; r < rowsN; r++) {
    const two = [cells[r], cells[nL + r]].some(cl => cl && cl.lines.length > 1);
    yRow.push(y); hRow.push(two ? 100 : 72); y += hRow[r];
  }
  const blockBot = y + 6, H = blockBot + 26;

  let out = board(W, H, { rt: 18 }) + edgeStitch(H, [12, 1188], 90);
  out += `<radialGradient id="halo"><stop offset="0" stop-color="${C.sig}" stop-opacity=".12"/><stop offset="1" stop-color="${C.sig}" stop-opacity="0"/></radialGradient><ellipse class="breathe" cx="600" cy="${PK.y + PK.h / 2}" rx="560" ry="300" fill="url(#halo)"/>`;

  // --- top band: board identity, revision, live status
  out += hole(46, 46) + hole(1154, 46) + fid(98, 46) + fid(1102, 46);
  out += text(128, 46, `${profile.login.toUpperCase()} / MAINBOARD`, { size: 18, ls: 3, fill: C.silk });
  out += text(128, 72, `REV ${D.rev} · RE-ROUTED DAILY FROM LIVE DATA`, { size: 16, ls: 1.4, fill: C.dim });
  const st = lastPush(D);
  const sw = tw(st.head, 18, 'M', 2);
  out += led(1072 - sw - 22, 40, { label: false }) + text(1072, 46, st.head, { size: 18, ls: 2, fill: C.silk, anchor: 'end' });
  if (st.sub) out += text(1072, 72, st.sub, { size: 16, ls: 1.4, fill: C.dim, anchor: 'end' });

  // --- functional block outline
  out += blockTop(100, BLOCK.L, BLOCK.R, '01', 'CPU') + blockSides(100, blockBot) + blockBottom(blockBot, BLOCK.L, BLOCK.R);

  // --- top pins: decoupling escapes; two pins drive Y1, the board's once-a-day clock
  q.pins.T.forEach((p, i) => {
    if (i % 3 === 1 || i > 15) return;
    const up = 16 + (i % 2) * 12;
    out += trace(`M${p.x} ${p.y}V${p.y - up}`, 2.4) + via(p.x, p.y - up - 4, 4);
  });
  const ya = q.pins.T[21], yb = q.pins.T[23];
  out += trace(`M${ya.x} ${ya.y}V138`, 2.4) + trace(`M${yb.x} ${yb.y}V138`, 2.4) + crystal(ya.x + 4, 126, yb.x - ya.x - 8, 22);
  out += text(ya.x - 18, 144, 'Y1 · 1 TICK / DAY', { size: 16, ls: 1.4, fill: C.dim, anchor: 'end' });

  // --- left and right pins: three each become the system bus that runs down the whole page
  const busRoutes = [];
  [['L', [2, 4, 6]], ['R', [2, 4, 6]]].forEach(([s, idx]) => {
    q.pins[s].forEach((p, i) => {
      if (idx.includes(i)) return;
      const dx = s === 'L' ? -8 : 8;
      out += trace(`M${p.x} ${p.y}H${p.x + dx}`, 2.4) + via(p.x + dx + (s === 'L' ? -4 : 4), p.y, 3.6);
    });
    idx.forEach((pi, j) => {
      const p = q.pins[s][pi], bx = s === 'L' ? BUS.L[j] : BUS.R[2 - j];
      const r = chamfer([[p.x, p.y], [bx, p.y], [bx, H]], 12);
      busRoutes.push({ r, line: s === 'L' ? j : 5 - j });
      out += trace(r.d, 3.4);
    });
  });

  // --- bottom pins fan out into the pin assignment (chamfered, no crossings)
  const fan = [], usedB = new Set();
  cols.forEach((c, ci) => {
    const n = ci ? nR : nL; if (!n) return;
    const first = q.pins.B.findIndex(p => p.x > c.ch[n - 1] + 22);
    for (let j = 0; j < n; j++) {
      const p = q.pins.B[first + j], row = n - 1 - j, cell = cells[(ci ? nL : 0) + row];
      const yr = yRow[row];
      const r = chamfer([[p.x, p.y], [p.x, PK.y + PK.h + 42 + j * 14], [c.ch[j], PK.y + PK.h + 42 + j * 14], [c.ch[j], yr], [c.pad, yr]], 10);
      fan.push({ r, row, ci }); usedB.add(first + j);
      out += trace(r.d, 2.6) + via(c.pad, yr, 6);
      out += text(c.tx, yr + 6, `P${String(11 + first + j).padStart(2, '0')} · ${cell.k}`, { size: 16, ls: 2.4, fill: C.gold });
      cell.lines.forEach((ln, l) => (out += text(c.tx, yr + 40 + l * 30, ln, { size: cell.size, font: 'B', fill: C.silk })));
    }
  });
  q.pins.B.forEach((p, i) => { if (i % 2 && !usedB.has(i)) out += trace(`M${p.x} ${p.y}V${p.y + 10}`, 2.2) + via(p.x, p.y + 14, 3.2); });

  // --- U1: the decapped package
  const dc = decap(cav, die, { nT: 26, nS: 7, id: 'u1d' });
  out += q.svg + dc.svg;
  const names = [profile.firstName, profile.lastName].map(s => String(s || '').toUpperCase());
  const s = Math.floor(fit(names.reduce((a, b) => (tw(a, 1, 'D') > tw(b, 1, 'D') ? a : b)), die.w - 84, 78, 'D'));
  out += `<linearGradient id="nm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D9D2C2"/></linearGradient>`;
  out += text(die.x + 34, die.y + 42, profile.login.toUpperCase(), { size: 16, ls: 4, fill: '#9AA0C4' });
  out += text(die.x + die.w - 34, die.y + 42, 'U1', { size: 16, ls: 4, fill: '#9AA0C4', anchor: 'end' });
  const b1 = die.y + 130, b2 = b1 + s + 4;
  [[names[0], b1], [names[1], b2]].forEach(([nm, by]) => {
    out += text(602, by + 2, nm, { size: s, font: 'D', anchor: 'middle', fill: '#000', op: 0.55 });
    out += text(600, by, nm, { size: s, font: 'D', anchor: 'middle', fill: 'url(#nm)' });
  });
  out += text(600, b2 + 46, String(profile.identity?.[0] || '').toUpperCase(), { size: 20, ls: 6, fill: C.gold, anchor: 'middle' });
  out += `<circle cx="${PK.x + 24}" cy="${PK.y + 24}" r="7" fill="#070808" stroke="#262B28"/>`;

  // --- current: page-synced flow on the bus, a chase on the bond wires, a slow scan down the pinout
  let cur = dc.overlay;
  busRoutes.forEach(({ r, line }) => (cur += flow(r, BUS_PHASE[line] + H - r.len)));
  fan.sort((a, b) => a.ci - b.ci || a.row - b.row).forEach((f, i) => (cur += `<path class="fg" d="${f.r.d}" fill="none" stroke="${C.sig}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="animation-delay:${(i * 0.35).toFixed(2)}s"/>`));

  const desc = `A matte black circuit board. The main processor U1 is decapped to show its silicon die, etched with the name ${profile.name} and the words ${profile.identity?.[0] || ''}. Its pins break out to: ${F.map(([, v]) => v).join('; ')}. ${st.head.toLowerCase()}.`;
  return doc({ w: W, h: H, title: `${profile.name}: ${profile.role} at ${profile.company}`, desc, css: DIE_CSS + FACT_CSS, body: out + cur });
}
