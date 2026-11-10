// Part drawings for AMWAG ATTENDANCE (bilingual time-clock dial) and BOSLA (compass with real figures).
import { C, W, T, L, R, P, Ci, DASH, r2, up, dimH, balloon } from './svg.mjs';
import { redNote, redArrow, callout } from './parts.mjs';
import { features, figures } from './data.mjs';

const pol = (cx, cy, r, deg) => [cx + r * Math.sin(deg * Math.PI / 180), cy - r * Math.cos(deg * Math.PI / 180)];

// Arabic-Indic numerals as single-stroke lettering (so they render identically everywhere).
const AR = {
  '1': 'M4.6 0.4L5.2 16',
  '2': 'M4.4 16L3 3C4.4 5.2 7.4 5 8.8 0.4',
  '3': 'M4.4 16L3 3C3.8 4.8 5.4 4.8 6 1.4C6.6 4.8 8.6 4.8 9.8 0.4',
  '6': 'M1.2 0.8Q4 4 7.6 1.2L8.4 16',
  '9': 'M7.4 5.4C3 8.2 0.8 3.6 3.4 1.2C5.6 -0.8 8.2 1.4 7.6 5.2L8.4 16',
};
// Same visual weight as the Latin numerals: cap height ~16u, stroke ~3u.
function arabicNum(str, x, y, s = 1.05) {
  let d = '', off = 0;
  for (const ch of String(str)) { d += `<path transform="translate(${r2(off * s)} 0) scale(${s})" d="${AR[ch]}" vector-effect="non-scaling-stroke"/>`; off += 10; }
  return `<g transform="translate(${r2(x - off * s / 2)} ${r2(y)})" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;
}

export function attendance(box, p) {
  const feats = features(p.line).map(up);
  const cx = box.x + 196, cy = box.y + 206, Rr = 150;
  let s = '', css = '';
  s += L(cx - Rr - 22, cy, cx + Rr + 22, cy, { c: C.thin, w: W.hair, dash: DASH.center }) + L(cx, cy - Rr - 22, cx, cy + Rr + 22, { c: C.thin, w: W.hair, dash: DASH.center });
  s += Ci(cx, cy, Rr, { c: C.ink, w: W.thick, fill: C.sheetLo }) + Ci(cx, cy, Rr - 9, { c: C.line, w: W.thin });
  // bezel section hatch (ring between R and R-9)
  s += `<path d="M${cx - Rr} ${cy}a${Rr} ${Rr} 0 1 0 ${Rr * 2} 0a${Rr} ${Rr} 0 1 0 ${-Rr * 2} 0ZM${cx - Rr + 9} ${cy}a${Rr - 9} ${Rr - 9} 0 1 1 ${(Rr - 9) * 2} 0a${Rr - 9} ${Rr - 9} 0 1 1 ${-(Rr - 9) * 2} 0Z" fill="url(#h31)" fill-rule="evenodd"/>`;
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0, a = i * 6;
    const [x1, y1] = pol(cx, cy, Rr - 14, a), [x2, y2] = pol(cx, cy, Rr - (major ? 30 : 21), a);
    s += L(x1, y1, x2, y2, { c: major ? C.ink : C.line, w: major ? W.thick : W.hair });
  }
  // bilingual numerals at the quarters: Latin outside ring, Arabic-Indic inside
  [['12', 0], ['3', 90], ['6', 180], ['9', 270]].forEach(([n, a]) => {
    const [x, y] = pol(cx, cy, Rr - 50, a), [ax, ay] = pol(cx, cy, Rr - 82, a);
    s += T(x, y + 8, n, { size: 22, font: 'disp', fill: C.ink, anchor: 'middle' });
    s += arabicNum(n, ax, ay - 8.4);
  });
  // hands at 10:08, second hand sweeps (red)
  const hand = (deg, len, wd, cls, col = C.ink, tail = 18) => `<g transform="translate(${cx} ${cy})"><g class="spin ${cls}" style="transform:rotate(${deg}deg)"><path d="M${-wd} ${tail}L${-wd * 0.55} ${-len}L0 ${-len - 8}L${wd * 0.55} ${-len}L${wd} ${tail}Z" fill="${col === C.ink ? C.sheet : 'none'}" stroke="${col}" stroke-width="${W.med}" stroke-linejoin="round"/></g></g>`;
  s += hand(304, 70, 6, 'hh') + hand(48, 104, 4.5, 'mh');
  s += `<g transform="translate(${cx} ${cy})"><g class="spin sh"><line x1="0" y1="26" x2="0" y2="-118" stroke="${C.red}" stroke-width="1.6"/><circle cy="-92" r="5" fill="none" stroke="${C.red}" stroke-width="1.6"/></g></g>`;
  s += Ci(cx, cy, 9, { c: C.ink, w: W.med, fill: C.sheet }) + Ci(cx, cy, 3, { c: C.red, w: 1.4 });
  // feature callouts stacked on the right, leaders to points on the bezel
  const tx = box.x + box.w - 236, n = Math.min(5, feats.length);
  feats.slice(0, n).forEach((f, i) => {
    const ang = 38 + i * (104 / Math.max(1, n - 1)), [px, py] = pol(cx, cy, Rr, ang);
    const ty = box.y + 82 + i * 56;
    s += balloon(tx - 22, ty, String(i + 1), px, py, { r: 11, size: 11 });
    s += T(tx - 2, ty + 5, f, { size: 13, fill: C.ink, ls: 1, tl: f.length * 8 > 230 ? 230 : null });
  });
  s += T(box.x + 8, box.y + box.h - 6, 'FRONT VIEW  ·  DIAL  ·  AR / EN NUMERALS', { size: 11, fill: C.muted, ls: 1.6 });
  if (/production/i.test(p.kind)) {
    const sx = box.x + box.w - 150, sy = box.y + box.h - 46;
    s += `<g transform="rotate(-8 ${sx} ${sy})" opacity=".92">${R(sx - 66, sy - 18, 166, 34, { c: C.red, w: 2.2, rx: 4 })}${R(sx - 62, sy - 14, 158, 26, { c: C.red, w: 0.9, rx: 2 })}` +
      T(sx + 17, sy + 4.5, 'IN PRODUCTION', { size: 12, font: 'disp', fill: C.red, anchor: 'middle', ls: 1 }) + '</g>';
  }
  css += `@keyframes sh{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.sh{transform-origin:0 0;animation:sh 60s steps(60) infinite}` +
    `.hh,.mh{transform-origin:0 0}`;
  return { svg: s, css };
}

export function bosla(box, p) {
  const figs = figures(p.line), cx = box.x + 430, cy = box.y + 190, Rr = 134;
  let s = '', css = '';
  s += L(cx - Rr - 24, cy, cx + Rr + 24, cy, { c: C.thin, w: W.hair, dash: DASH.center }) + L(cx, cy - Rr - 10, cx, cy + Rr + 24, { c: C.thin, w: W.hair, dash: DASH.center });
  s += Ci(cx, cy, Rr, { c: C.ink, w: W.thick, fill: C.sheetLo }) + Ci(cx, cy, Rr - 20, { c: C.line, w: W.med });
  for (let a = 0; a < 360; a += 5) {
    const big = a % 45 === 0, [x1, y1] = pol(cx, cy, Rr - 2, a), [x2, y2] = pol(cx, cy, Rr - (big ? 18 : a % 15 === 0 ? 11 : 7), a);
    s += L(x1, y1, x2, y2, { c: big ? C.ink : C.line, w: big ? W.med : W.hair });
  }
  // 8-point rose; cardinal points long, intercardinal short; each point split hatched / plain
  for (let k = 0; k < 8; k++) {
    const a = k * 45, len = k % 2 ? Rr * 0.48 : Rr - 30, wd = k % 2 ? 11 : 17;
    const tip = pol(cx, cy, len, a), l = pol(cx, cy, wd, a - 45), rr = pol(cx, cy, wd, a + 45);
    s += `<path d="M${r2(cx)} ${r2(cy)}L${r2(l[0])} ${r2(l[1])}L${r2(tip[0])} ${r2(tip[1])}Z" fill="url(#h31)" stroke="${C.ink}" stroke-width="${W.med}" stroke-linejoin="round"/>`;
    s += `<path d="M${r2(cx)} ${r2(cy)}L${r2(rr[0])} ${r2(rr[1])}L${r2(tip[0])} ${r2(tip[1])}Z" fill="${C.sheet}" stroke="${C.ink}" stroke-width="${W.med}" stroke-linejoin="round"/>`;
  }
  [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([n, a]) => { const [x, y] = pol(cx, cy, Rr + 16, a); s += T(x, y + 6, n, { size: 17, font: 'disp', fill: C.ink, anchor: 'middle' }); });
  // needle (red north) that swings and settles
  s += `<g transform="translate(${cx} ${cy})"><g class="spin ndl"><path d="M0 ${-Rr + 40}L8 0L0 6L-8 0Z" fill="${C.red}" fill-opacity=".9" stroke="${C.red}" stroke-width="1"/><path d="M0 ${Rr - 52}L8 0L-8 0Z" fill="none" stroke="${C.ink}" stroke-width="${W.med}"/></g></g>`;
  s += Ci(cx, cy, 8, { c: C.ink, w: W.med, fill: C.sheet });
  // real figures from the project line, drawn as dimensions and callouts
  const fig = re => figs.find(f => re.test(f.label));
  const ctry = fig(/countr/i), src = fig(/source/i), skl = fig(/skill/i), post = fig(/posting|job/i);
  if (ctry) s += dimH(cx - Rr, cx + Rr, cy + Rr + 54, `Ø  ${ctry.n} ${up(ctry.label)}`, { y0: cy + 30, size: 12.5, ls: 2 });
  const lx = box.x + 200;
  if (post) s += T(box.x + 16, box.y + 92, post.n, { size: 40, font: 'disp', fill: C.ink }) + T(box.x + 18, box.y + 114, up(post.label), { size: 11, fill: C.muted, ls: 1.6 });
  const items = [src && [src, pol(cx, cy, Rr * 0.48, 315)], skl && [skl, pol(cx, cy, Rr - 20, 250)]].filter(Boolean);
  items.forEach(([f, [px, py]], i) => {
    s += callout(px, py, lx, box.y + 178 + i * 84, [{ t: f.n, size: 26, font: 'disp', fill: C.ink, ls: 1 }, { t: up(f.label), size: 11, fill: C.muted }], { lh: 22 });
  });
  const next = (p.line.match(/what to [^.,]+/i) || [])[0];
  if (next) s += redNote(cx - 214, cy - Rr - 2, next, { size: 21, rot: -3 }) + redArrow(cx - 50, cy - Rr - 4, cx - 12, cy - Rr + 34, { bow: 0.3 });
  s += T(box.x + 16, box.y + box.h - 6, 'PLAN VIEW  ·  BEARINGS IN DEGREES', { size: 11, fill: C.muted, ls: 1.6 });
  css += `@keyframes ndl{0%,55%{transform:rotate(0deg)}61%{transform:rotate(26deg)}67%{transform:rotate(-17deg)}73%{transform:rotate(10deg)}79%{transform:rotate(-5deg)}85%{transform:rotate(2deg)}91%,100%{transform:rotate(0deg)}}` +
    `.ndl{transform-origin:0 0;animation:ndl 9s cubic-bezier(.4,0,.3,1) infinite}`;
  return { svg: s, css };
}
