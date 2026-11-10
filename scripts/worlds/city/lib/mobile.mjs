// Phone compositions (shown through <picture><source media="(max-width: 600px)">). Same city, same
// drawing functions, recomposed for a portrait column: art on top, copy below, nothing smaller than
// about 20 units on a 600-wide canvas (copy 26), which is about 14-16 px on a phone.
// Every phone card is 600 wide plus the same 12-unit transparent gutters as desktop, so the column
// lines up; half tiles are 288 wide, so two of them span the same 624 units.
import { svgDoc, f, esc, P as PAL, stars, tag, TL, pill, monoFit } from './svg.mjs';
import { displayWidth } from './metrics.mjs';
import { MOTION } from './motion.mjs';
import { cairoTime } from './hero.mjs';
import { scene, place, liveFor, wrapFit, fitSize, linkLabel, frameBg, SHARED_DEFS } from './scene.mjs';
import { stamp, postmark } from './stamp.mjs';
import { postPlate } from './plate.mjs';

export const MW = 600, PAD = 36, COL = MW - 2 * PAD;

// Greedy word wrap measured in the display face.
export function wrapD(text, maxW, size, ls = 0) {
  const out = []; let line = '';
  for (const w of String(text).split(' ')) {
    const t = line ? line + ' ' + w : w;
    if (line && displayWidth(t, size, ls) > maxW) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}
// Display text in at most `rows` lines: the largest size <= base at which the wrapped lines fit.
export function fitLinesD(text, maxW, base, { ls = 1, rows = 2, oneLineMin = 0 } = {}) {
  const one = fitSize(text, maxW, base, ls);
  if (one >= Math.min(base, oneLineMin || base) || rows < 2) return { size: one, lines: [text] };
  // a parenthesis is the natural break: "JOB-MARKET INTELLIGENCE" / "(DEPI R5 FINAL PROJECT)"
  const k = text.indexOf(' (');
  if (k > 0) {
    const lines = [text.slice(0, k), text.slice(k + 1)], s = Math.min(base, ...lines.map(l => fitSize(l, maxW, base, ls)));
    if (s >= (oneLineMin || base) * 0.8) return { size: s, lines };
  }
  for (let s = base; s > 10; s -= 2) {
    const lines = wrapD(text, maxW, s, ls);
    if (lines.length <= rows && lines.every(l => displayWidth(l, s, ls) <= maxW)) return { size: s, lines };
  }
  return { size: one, lines: [text] };
}
// Display text lines, top of the first line's caps at `top`; returns { svg, bottom }.
export function displayBlock(x, top, fit, { fill = PAL.cream, ls = 1, lh = 0.98, anchor = 'start' } = {}) {
  let s = '', y = top + fit.size * 0.74;
  fit.lines.forEach((l, i) => {
    if (i) y += fit.size * lh;
    s += `<text x="${f(x)}" y="${f(y)}" class="d" font-size="${f(fit.size)}" fill="${fill}" letter-spacing="${ls}" text-anchor="${anchor}" ${TL(l, fit.size, ls)}>${esc(l)}</text>`;
  });
  return { svg: s, bottom: y };
}

// Coral call-to-action across the column (the whole image is the link; this says where it goes).
export function ctaWide(x, y, w, label, { h = 64, size = 23 } = {}) {
  return `<g transform="translate(${f(x)},${f(y)})"><rect width="${f(w)}" height="${h}" rx="${h / 2}" fill="${PAL.coral}"/>`
    + `<text x="30" y="${f(h / 2 + size * 0.36)}" class="m" font-size="${size}" fill="#2a0f24" letter-spacing="2">${esc(label)}</text>`
    + `<path d="M${f(w - 44)} ${f(h / 2 + 9)} l17 -17 M${f(w - 40)} ${f(h / 2 - 8)} h13 v13" stroke="#2a0f24" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}
// Card frame shared by the phone cards: clipped dusk background, hairline rim.
export function cardBody(w, h, id, inner) {
  return `<g clip-path="url(#fr${id})"><rect width="${w}" height="${h}" fill="url(#bg${id})"/><rect width="${w}" height="${h}" fill="url(#gl${id})"/>${inner}</g>`
    + `<rect x=".75" y=".75" width="${w - 1.5}" height="${h - 1.5}" rx="23.5" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1.5"/>`;
}
export const liveDot = (x, y, text, { size = 21, fill = PAL.cream } = {}) =>
  `<circle cx="${f(x + 6)}" cy="${f(y - size * 0.34)}" r="6" fill="#6dffb0" class="blink"/>` + tag(x + 24, y, text, { size, fill, ls: 1.6 });

// The postcard's "notice the detail" labels, re-set for the phone: same points on the building,
// larger type, two short lines each ('|' breaks), offsets chosen for the 600-wide art.
const CALLOUTS = {
  cortex: [[2, 2, 16.7, 46, 34, 'BEACON|ALWAYS ON']],
  dose: [[1.8, 2.9, 2.6, -58, -64, 'FIND|YOUR DÖSE'], [3.1, 1.5, 1.4, 36, 54, 'CART +|DISCOUNT LOGIC']],
  attendance: [[2.5, 2.8, 7.2, 56, -22, 'CLOCK ·|LAST REFRESH'], [1.4, 4.9, 0.6, -40, 46, 'BRANCH +|IP CHECKS']],
  bosla: [[2, 2, 6.8, -52, -36, 'NEEDLE · WHAT|TO LEARN NEXT'], [4.3, 2.2, 1.6, 40, 54, 'THE DATA|PLAZA']],
};
const callouts = key => (I, b) => (CALLOUTS[key] || []).map(([x, y, z, dx, dy, text]) => {
  const [px, py] = I.P(b[0] + x, b[1] + y, z), tx = px + dx, ty = py + dy, end = dx < 0, lines = text.split('|');
  return `<path d="M${f(px)} ${f(py)} L${f(tx)} ${f(ty)} h${end ? -10 : 10}" fill="none" stroke="${PAL.cream}" stroke-opacity=".7" stroke-width="1.6"/><circle cx="${f(px)}" cy="${f(py)}" r="3.6" fill="${PAL.cream}"/>`
    + lines.map((l, i) => tag(tx + (end ? -16 : 16), ty + 6 + (i - (lines.length - 1) / 2) * 24, l, { size: 19, fill: PAL.cream, ls: 1.2, anchor: end ? 'end' : 'start' })).join('');
}).join('');

// Featured postcard, portrait: the building on its plot with its stamp and postmark, then the copy.
export function featuredM(project, idx, data, profile) {
  const flip = idx % 2 === 1, live = liveFor(project, data), num = String(idx + 1).padStart(2, '0');
  const sc = scene(project, MW / 2, data, { big: true, clockTime: cairoTime(data.generatedAt), litFrac: live.litFrac, extra: callouts(project.key) });
  const keys = new Set(profile.projects.map(p => p.key));
  const sx = flip ? MW - 30 - 140 : 30;
  let deco = stamp(sx, 26, project.key, num, { keys });
  if (live.repo && deco) deco += postmark(flip ? sx - 26 : sx + 140 + 26, 72, live.repo.pushedAt, { dir: flip ? 1 : -1, id: `pm${idx}` });
  if (idx === 0) deco += postPlate(128, 432, 'landmark', { height: 236, en: 24, ar: 22 }).svg;

  // copy, top to bottom
  const where = `No. ${num} · ${place(project)}`, ws = monoFit(where, COL, 20, 1.6);
  let y = 470, t = tag(PAD, y, ws >= 17 ? where : `No. ${num} · ${place(project).split(' · ')[0]}`, { size: f(Math.max(17, ws)), fill: PAL.peach, ls: 1.6 });
  const nm = displayBlock(PAD - 3, y + 30, fitLinesD(project.name, COL, 116, { ls: 1, oneLineMin: 84 }));
  t += nm.svg; y = nm.bottom;
  const kd = displayBlock(PAD, y + 26, fitLinesD(project.kind.toUpperCase(), COL, 36, { ls: 2, oneLineMin: 30 }), { fill: PAL.lav, ls: 2, lh: 1.12 });
  t += kd.svg; y = kd.bottom + 22;
  const size = 26, lh = 37, lines = wrapFit(project.line, COL, size, 0, 7);
  if (project.tagline && lines.length < 7) lines.push(...wrapFit(project.tagline, COL, size, 0, 7 - lines.length).map(l => '>> ' + l));
  lines.forEach(l => { const q = l.startsWith('>> '); y += lh; t += tag(PAD, y, q ? l.slice(3) : l, { size, fill: q ? PAL.peach : '#efe4ff', ls: 0 }); });
  y += 26;
  let px = PAD;
  for (const st of project.stack) { const p = pill(px, y, st, { size: 19, ls: 1.4, pad: 14, h: 38 }); if (px + p.w > PAD + COL) break; t += p.svg; px += p.w + 10; }
  y += 38;
  if (live.repo) { y += 50; t += liveDot(PAD, y, `LAST BRICK LAID ${live.when.toUpperCase()}`); }
  y += 30;
  t += ctaWide(PAD, y, COL, linkLabel(project.url));
  const Ht = Math.round(y + 64 + 36);

  const defs = frameBg(MW, Ht, flip ? 0.7 : 0.3, 0.28, 'f') + SHARED_DEFS + sc.defs;
  const body = cardBody(MW, Ht, 'f', stars(MW, Ht, 34, project.key, { maxY: 260 }) + sc.svg + deco + t);
  return svgDoc({ w: MW, h: Ht, title: `${num} ${project.name}: ${project.kind}`, desc: project.line, css: MOTION, defs, body, fonts: { arabic: idx === 0 } });
}
