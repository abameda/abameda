// Featured postcards: one linked SVG per landmark. Art on one side (the building on its plot, with
// labelled details), a stamp printed with the city map and a postmark from the last push; the copy
// on the other side. Card 01 also carries the enamel plate that names the avenue.
import { svgDoc, f, esc, P as PAL, stars, tag, TL, pill } from './svg.mjs';
import { MOTION } from './motion.mjs';
import { cairoTime } from './hero.mjs';
import { scene, place, liveFor, wrapFit, fitSize, linkLabel, cta, frameBg, SHARED_DEFS } from './scene.mjs';
import { stamp, postmark } from './stamp.mjs';
import { postPlate } from './plate.mjs';

export { place, liveFor, wrapFit, fitSize, linkLabel, frameBg, SHARED_DEFS, scene };

// "Notice the detail" layer: what each building feature stands for. Points are relative to the
// building origin in world units; dx/dy place the label in screen px.
const CALLOUTS = {
  cortex: [[2, 2, 16.7, 50, 14, 'BEACON · ALWAYS ON']],
  dose: [[1.8, 2.9, 2.6, -70, -40, 'FIND YOUR DÖSE'], [3.1, 1.5, 1.4, 38, 26, 'CART + DISCOUNT LOGIC']],
  attendance: [[2.5, 2.8, 7.2, 60, -10, 'CLOCK · LAST REFRESH'], [1.4, 4.9, 0.6, -56, 36, 'BRANCH + IP CHECKS']],
  bosla: [[2, 2, 6.8, -78, -14, 'NEEDLE · WHAT TO LEARN NEXT'], [4.3, 2.2, 1.6, 56, 34, 'THE DATA PLAZA']],
};
const callouts = key => (I, b) => (CALLOUTS[key] || []).map(([x, y, z, dx, dy, text]) => {
  const [px, py] = I.P(b[0] + x, b[1] + y, z), tx = px + dx, ty = py + dy, end = dx < 0;
  return `<path d="M${f(px)} ${f(py)} L${f(tx)} ${f(ty)} h${end ? -8 : 8}" fill="none" stroke="${PAL.cream}" stroke-opacity=".6" stroke-width="1.1"/><circle cx="${f(px)}" cy="${f(py)}" r="2.6" fill="${PAL.cream}"/>`
    + tag(tx + (end ? -12 : 12), ty + 4.5, text, { size: 13, fill: PAL.cream, ls: 1.2, anchor: end ? 'end' : 'start' });
}).join('');

export function featured(project, idx, data, profile) {
  const Wd = 1200, Ht = 420, flip = idx % 2 === 1, live = liveFor(project, data);
  const artX = flip ? 872 : 300, textX = flip ? 72 : 600, colW = 540;
  const sc = scene(project, artX, data, { big: true, clockTime: cairoTime(data.generatedAt), litFrac: live.litFrac, extra: callouts(project.key) });
  const num = String(idx + 1).padStart(2, '0');

  // postcard furniture in the art side's top outer corner
  const keys = new Set(profile.projects.map(p => p.key));
  const sx = flip ? Wd - 34 - 140 : 34;
  let deco = stamp(sx, 26, project.key, num, { keys });
  if (live.repo && deco) deco += postmark(flip ? sx - 26 : sx + 140 + 26, 72, live.repo.pushedAt, { dir: flip ? 1 : -1, id: `pm${idx}` });
  if (idx === 0) deco += postPlate(132, 432, 'landmark', { height: 150, en: 22, ar: 20 }).svg;

  // copy
  const nameSize = fitSize(project.name, colW, 96), kind = project.kind.toUpperCase(), kindSize = fitSize(kind, colW, 27, 2);
  let t = tag(textX, 58, `No. ${num}   ${place(project)}`, { size: 13, fill: PAL.peach, ls: 2.6 });
  t += `<text x="${textX - 3}" y="160" class="d" font-size="${f(nameSize)}" fill="${PAL.cream}" letter-spacing="1" ${TL(project.name, nameSize, 1)}>${esc(project.name)}</text>`;
  t += `<text x="${textX}" y="198" class="d" font-size="${f(kindSize)}" fill="${PAL.lav}" letter-spacing="2" ${TL(kind, kindSize, 2)}>${esc(kind)}</text>`;
  const size = 15, lines = wrapFit(project.line, colW, size, 0.1, 4);
  if (project.tagline && lines.length < 4) lines.push(...wrapFit(project.tagline, colW, size, 0.1, 4 - lines.length).map(l => '>> ' + l));
  lines.forEach((l, i) => {
    const q = l.startsWith('>> ');
    t += tag(textX, 234 + i * 23, q ? l.slice(3) : l, { size, fill: q ? PAL.peach : '#efe4ff', ls: 0.1 });
  });
  const yb = 234 + lines.length * 23 + 4;
  let px = textX;
  for (const st of project.stack) { const p = pill(px, yb, st, { size: 12, ls: 1.2 }); if (px + p.w > textX + colW) break; t += p.svg; px += p.w + 8; }
  if (live.repo) t += `<circle cx="${textX + 5}" cy="${Ht - 49}" r="4" fill="#6dffb0" class="blink"/>` + tag(textX + 18, Ht - 44, `LAST BRICK LAID ${live.when.toUpperCase()}`, { size: 12, fill: PAL.cream, ls: 1.6 });
  t += cta(textX + colW, Ht - 70, linkLabel(project.url), 'end');

  const defs = frameBg(Wd, Ht, flip ? 0.75 : 0.25, 0.75, 'f') + SHARED_DEFS + sc.defs;
  const body = `<g clip-path="url(#frf)"><rect width="${Wd}" height="${Ht}" fill="url(#bgf)"/><rect width="${Wd}" height="${Ht}" fill="url(#glf)"/>`
    + stars(Wd, Ht, 40, project.key, { maxY: 220 }) + sc.svg + deco + t + '</g>'
    + `<rect x=".75" y=".75" width="${Wd - 1.5}" height="${Ht - 1.5}" rx="23.5" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1.5"/>`;
  return svgDoc({ w: Wd, h: Ht, title: `${num} ${project.name}: ${project.kind}`, desc: project.line, css: MOTION, defs, body, fonts: { arabic: idx === 0 } });
}
