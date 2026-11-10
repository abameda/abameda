// SHEET 01: General arrangement. The man as the engineered object.
import { C, W, T, L, R, Ci, DASH, r2, up, svgDoc, sheet, sheetHead, dimH, hatchDefs, balloon, arrow } from './svg.mjs';
import { gearTrain } from './gears.mjs';
import { cell, projSymbol, redCircle, redArrow, redNote } from './parts.mjs';

// Red-pen remarks. Optional profile.redlines overrides them; these are the defaults.
export const redline = (profile, key, def) => profile.redlines?.[key] ?? def;

export function hero(profile, data, ctx) {
  const w = 1200, h = 660;
  const sh = sheet(w, h, { nx: 8, ny: 4 });
  const first = up(profile.firstName), last = up(profile.lastName);
  const founder = profile.identity.find(s => /found/i.test(s)) || profile.identity.at(-1);
  const others = profile.identity.filter(s => s !== founder && !/creative engineer/i.test(s)).map(up);
  const tagline = up(profile.identity.find(s => /engineer/i.test(s)) || 'Engineer');
  const date = data.generatedAt.slice(0, 10);

  let b = sh.body;
  b += sheetHead(54, 50, '01', 'GENERAL ARRANGEMENT', `PROFILE OF @${up(profile.login)}  ·  DRAWING SET, ${ctx.sheets} SHEETS`);

  // --- Name block -------------------------------------------------------
  const nx = 62, nw = 640, b1 = 236, b2 = 338, cap = 70;
  for (const y of [b1 - cap, b1, b2 - cap, b2]) b += L(36, y, 1164, y, { c: C.ghost, w: W.hair, dash: '2 5' });
  b += L(nx, 128, nx, 380, { c: C.ghost, w: W.hair, dash: '2 5' }) + L(nx + nw, 128, nx + nw, 380, { c: C.ghost, w: W.hair, dash: '2 5' });
  b += dimH(nx, nx + nw, 142, `${tagline}  ·  1 : 1`, { y0: b1 - cap - 6, size: 13, ls: 3 });
  // line 1: sectioned (hatched) like a cut through solid material
  b += `<text x="${nx}" y="${b1}" font-family="'BPDisplay',sans-serif" font-size="94" textLength="${nw}" lengthAdjust="spacingAndGlyphs" fill="url(#h31)" stroke="${C.ink}" stroke-width="${W.med}" stroke-linejoin="round">${first}</text>`;
  // line 2: hidden-line ghost (offset, dashed) + visible outline
  b += `<text x="${nx + 7}" y="${b2 - 7}" font-family="'BPDisplay',sans-serif" font-size="94" textLength="${nw}" lengthAdjust="spacingAndGlyphs" fill="none" stroke="${C.faint}" stroke-width="${W.hair}" stroke-dasharray="5 4">${last}</text>`;
  b += `<text x="${nx}" y="${b2}" font-family="'BPDisplay',sans-serif" font-size="94" textLength="${nw}" lengthAdjust="spacingAndGlyphs" fill="${C.sheet}" fill-opacity=".55" stroke="${C.ink}" stroke-width="${W.med}" stroke-linejoin="round">${last}</text>`;
  // cutting plane A-A in the left margin: thin chain, thick ends, arrows give the viewing direction
  const cpx = 46, c1 = b1 - cap - 8, c2 = b1 + 8;
  b += L(cpx, c1, cpx, c2, { c: C.ink, w: W.thin, dash: DASH.center }) + L(cpx, c1, cpx, c1 + 13, { c: C.ink, w: 3.4 }) + L(cpx, c2 - 13, cpx, c2, { c: C.ink, w: 3.4 });
  for (const [y, ty] of [[c1, c1 - 5], [c2, c2 + 17]]) b += L(cpx, y, cpx + 8, y, { c: C.ink, w: W.med }) + arrow(cpx, y, cpx + 15, y, { c: C.ink, s: 8, wd: 3.4 }) + T(cpx + 6, ty, 'A', { size: 13, font: 'disp', fill: C.ink, anchor: 'middle' });
  // section label for line 1, hidden-line note with a leader onto the dashed ghost of line 2
  b += T(nx + nw + 16, b1 - 16, 'SECTION A-A', { size: 12, font: 'disp', fill: C.ink, ls: 1 }) + L(nx + nw + 16, b1 - 9, nx + nw + 122, b1 - 9, { c: C.ink, w: W.med });
  b += T(nx + nw + 16, b1 + 7, 'HATCH ANSI 31', { size: 10, fill: C.muted, ls: 1.2 });
  b += T(nx + nw + 22, b2 - 10, 'HIDDEN LINES', { size: 10, fill: C.muted, ls: 1.2 }) + T(nx + nw + 22, b2 + 5, 'SHOWN DASHED', { size: 10, fill: C.muted, ls: 1.2 });
  b += L(nx + nw + 18, b2 - 16, nx + nw + 4, b2 - 56, { c: C.thin, w: W.hair }) + arrow(nx + nw + 18, b2 - 16, nx + nw + 3, b2 - 59, { c: C.line, s: 8, wd: 2.6 });

  // role line
  b += T(nx, 394, `${up(profile.role)}  @  ${up(profile.company)}`, { size: 21, fill: C.ink, ls: 3 });
  const since = (data.user?.createdAt || '').slice(0, 4);
  b += T(nx, 420, [up(profile.location), since && `ON GITHUB SINCE ${since}`, data.totals?.publicRepos ? `${data.totals.publicRepos} PUBLIC REPOSITORIES` : ''].filter(Boolean).join('  ·  '), { size: 13.5, fill: C.muted, ls: 1.4 });

  // --- General notes: notes 1-3 are the gear legend ---------------------------
  const gy = 460, [eduWhat, eduWhere] = profile.education.split(',').map(s => up(s.trim()));
  b += T(nx, gy, 'GENERAL NOTES', { size: 13, font: 'disp', fill: C.ink, ls: 2 }) + L(nx, gy + 7, nx + 184, gy + 7, { c: C.ink, w: W.med });
  const notes = [
    { g: 1, t: others[0] || up(profile.role) },
    { g: 2, t: eduWhere ? `${eduWhat}, ${eduWhere}` : eduWhat },
    { g: 3, t: up(founder) },
    ...others.slice(1).map(t => ({ t })),
    { t: 'ALL LIVE FIGURES REGENERATED DAILY FROM GITHUB' },
  ].slice(0, 5);
  notes.forEach((n, i) => {
    const y = gy + 32 + i * 24;
    b += n.g ? Ci(nx + 9, y - 5, 10, { c: C.ink, w: W.thin }) + T(nx + 9, y, n.g, { size: 12, fill: C.ink, anchor: 'middle' }) : T(nx + 9, y, `${i + 1}.`, { size: 13, fill: C.muted, anchor: 'middle' });
    b += T(nx + 30, y, n.t, { size: 14, fill: n.g ? C.line : C.muted, ls: 0.4 });
  });

  // --- Gear train ------------------------------------------------------------
  const m = 5.2;
  const tr = gearTrain([
    { N: 38, at: [918, 292] },
    { N: 24, from: 0, angle: 38 },
    { N: 15, from: 0, angle: -52 },
  ], m, 46, 'g');
  b += tr.svg;
  const [g0, g1, g2] = tr.gears;
  b += balloon(g0.x - g0.rp - 14, g0.y + 118, '1', g0.x - g0.rp * 0.5, g0.y + g0.rp * 0.62);
  b += balloon(g1.x + g1.rp + 34, g1.y + 52, '2', g1.x + g1.rp * 0.55, g1.y + g1.rp * 0.5);
  b += balloon(g2.x + g2.rp + 58, g2.y + 40, '3', g2.x + g2.rp * 0.6, g2.y + g2.rp * 0.35);
  b += T(g0.x, g0.y + g0.rp + 26, `Z ${g0.N}  ·  m ${m}`, { size: 11, fill: C.muted, anchor: 'middle', ls: 1.5 });

  // redline: the reviewer circles the small gear
  const [r1, r2b] = redline(profile, 'hero', ['also founded', 'a fragrance house!']);
  b += redCircle(g2.x, g2.y, g2.rp + 20, g2.rp + 15, 11, { cls: 'pen' });
  b += redArrow(nx + nw + 196, 132, g2.x - g2.rp - 24, g2.y - 12, { bow: -0.2 });
  b += redNote(nx + nw + 30, 116, r1, { size: 21, rot: -3 }) + redNote(nx + nw + 38, 139, r2b, { size: 21, rot: -3 });

  // --- Top-right: projection + standard notes ---------------------------------
  b += projSymbol(1032, 74, 0.62) + T(1146, 100, 'THIRD ANGLE PROJECTION', { size: 9.5, fill: C.muted, anchor: 'end', ls: 1.2 });
  b += T(1146, 58, 'DO NOT SCALE DRAWING', { size: 10, fill: C.muted, anchor: 'end', ls: 1.4 });

  // --- Title block (bottom right, flush with the frame) -----------------------
  const tx = 734, ty = 512, tw = 1170 - tx;
  b += R(tx, ty, tw, 118, { c: C.ink, w: W.thick, fill: C.panel });
  b += cell(tx, ty, 150, 32, 'DRAWN', `@${profile.login}`, { size: 12.5, vb: 6 }) + cell(tx + 150, ty, 128, 32, 'DATE', date, { size: 12.5, vb: 6 }) +
    cell(tx + 278, ty, 72, 32, 'SCALE', '1:1', { size: 12.5, vb: 6 }) + cell(tx + 350, ty, tw - 350, 32, 'SHEET', `01 / ${String(ctx.sheets).padStart(2, '0')}`, { size: 12.5, vb: 6 });
  b += cell(tx, ty + 32, tw, 50, 'TITLE', up(profile.name), { size: 22, font: 'disp', vb: 10, tl: tw - 18 });
  b += cell(tx, ty + 82, 200, 36, 'REV A', up(profile.previousRole), { size: 13, vb: 7, fill: C.muted }) +
    cell(tx + 200, ty + 82, tw - 200, 36, 'REV B  · CURRENT', up(profile.role), { size: 13, vb: 7 });
  b += R(tx, ty, tw, 118, { c: C.ink, w: W.thick });

  // CAD cursor wandering between snap points (life on top of a finished drawing)
  const snaps = [[nx, 142], [nx + nw, 142], [g0.x, g0.y], [g1.x, g1.y], [g2.x, g2.y], [nx, b2]];
  let kf = '';
  const n = snaps.length;
  snaps.forEach(([x, y], i) => { kf += `${r2(i / n * 100)}%,${r2((i + 0.6) / n * 100)}%{transform:translate(${r2(x)}px,${r2(y)}px)}`; });
  kf += `100%{transform:translate(${snaps[0][0]}px,${snaps[0][1]}px)}`;
  b += `<g class="cur"><path d="M-16 0H-5M5 0H16M0 -16V-5M0 5V16" stroke="${C.red}" stroke-width="1.2"/><rect x="-5" y="-5" width="10" height="10" fill="none" stroke="${C.red}" stroke-width="1.2"/></g>`;

  const css = tr.css + `@keyframes cur{${kf}}.cur{animation:cur 18s cubic-bezier(.6,0,.2,1) infinite;transform:translate(${nx}px,142px)}`;
  return svgDoc({
    w, h, title: `${profile.name}: ${profile.identity[0]}, ${profile.role} at ${profile.company}`,
    desc: `Blueprint drawing sheet 01: the name ${profile.name} lettered as an engineering drawing with a meshing gear train, general notes and a title block.`,
    fonts: ['disp', 'mono', 'hand'], css, defs: sh.defs + hatchDefs(C.line, 0.7), body: b,
  });
}
