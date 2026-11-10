// Half-width tiles for the rest of the city, plus the construction hoarding for anything still in
// design (chosen from project.kind, so shipping it later turns it into a normal tile on its own).
import { svgDoc, f, esc, P as PAL, stars, tag, TL, pill, monoFit } from './svg.mjs';
import { MOTION } from './motion.mjs';
import { scene, liveFor, place, SHARED_DEFS, frameBg, wrapFit, fitSize, linkLabel } from './scene.mjs';

export const inDesign = p => /in design|in progress/i.test(p.kind);
export const arrowBtn = (x, y) => `<g transform="translate(${x},${y})"><circle r="22" fill="${PAL.coral}"/><path d="M-6 6 L6 -6 M-3 -6 H6 V3" stroke="#2a0f24" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;

// Pills in rows of maxW; shrink once before wrapping, and mark anything that still does not fit.
function pillRows(stack, x, y, maxW, rows = 2) {
  for (const size of [12, 11]) {
    let s = '', cx = x, cy = y, r = 1, shown = 0;
    for (const st of stack) {
      let p = pill(cx, cy, st, { size, ls: 1, pad: 9, h: 23 });
      if (cx + p.w > x + maxW && cx > x) { if (r === rows) break; r++; cx = x; cy += 30; p = pill(cx, cy, st, { size, ls: 1, pad: 9, h: 23 }); }
      if (p.w > maxW) break;
      s += p.svg; cx += p.w + 7; shown++;
    }
    if (shown === stack.length || size === 11) {
      if (shown < stack.length) s += tag(cx, cy + 16, `+${stack.length - shown}`, { size: 12, fill: PAL.lav, ls: 1 });
      return { svg: s, bottom: cy + 23 };
    }
  }
}

export function tile(project, idx, data) {
  const Wd = 588, Ht = 340, live = liveFor(project, data), num = String(idx + 1).padStart(2, '0');
  const sc = scene(project, 424, data, { litFrac: live.litFrac });
  const tx = 34, colW = 262;
  let t = tag(tx, 48, `No. ${num}`, { size: 14, fill: PAL.peach, ls: 2.4 }) + tag(tx + 78, 48, place(project).split(' · ')[0], { size: 11.5, fill: PAL.mute, ls: 1.8 });
  const size = fitSize(project.name, colW, 56, 0.5), ny = 58 + size * 0.86;
  t += `<text x="${tx - 2}" y="${f(ny)}" class="d" font-size="${f(size)}" fill="${PAL.cream}" letter-spacing=".5" ${TL(project.name, size, 0.5)}>${esc(project.name)}</text>`;
  const kind = project.kind.toUpperCase(), ks = monoFit(kind, colW, 12, 1.2);
  t += tag(tx, ny + 26, kind, { size: f(ks), fill: PAL.lav, ls: 1.2 });
  const lines = wrapFit(project.line, colW, 13.5, 0, 4);
  lines.forEach((l, i) => { t += tag(tx, ny + 54 + i * 20, l, { size: 13.5, fill: '#efe4ff', ls: 0 }); });
  const pr = pillRows(project.stack, tx, ny + 54 + lines.length * 20 - 4, colW);
  t += pr.svg;
  if (live.repo) t += `<circle cx="${tx + 5}" cy="${Ht - 37}" r="4" fill="#6dffb0" class="blink"/>` + tag(tx + 18, Ht - 32, `LAST BRICK LAID ${live.when.toUpperCase()}`, { size: 12, fill: PAL.lav, ls: 1.3 });
  t += arrowBtn(Wd - 44, Ht - 44);
  const defs = frameBg(Wd, Ht, 0.72, 0.7, 't') + SHARED_DEFS + sc.defs;
  const body = `<g clip-path="url(#frt)"><rect width="${Wd}" height="${Ht}" fill="url(#bgt)"/><rect width="${Wd}" height="${Ht}" fill="url(#glt)"/>`
    + stars(Wd, Ht, 22, project.key, { maxY: 160 }) + sc.svg + t + '</g>'
    + `<rect x=".75" y=".75" width="${Wd - 1.5}" height="${Ht - 1.5}" rx="23.5" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1.5"/>`;
  return svgDoc({ w: Wd, h: Ht, title: `${num} ${project.name}: ${project.kind}`, desc: `${project.line} (${linkLabel(project.url).toLowerCase()})`, css: MOTION, defs, body });
}

// "designed doc-first: product brief, MVP scope and architecture decisions before code" -> 4 steps
export function docSteps(line) {
  const m = line.match(/:\s*([^:]+?)\s+before\s+([\w ]+?)\.?$/i);
  if (!m) return null;
  return { design: m[1].split(/,\s*|\s+and\s+/).map(s => s.trim().toUpperCase()).filter(Boolean), then: m[2].trim().toUpperCase() };
}

// In design: a fenced lot with a crane, and the plan pinned to the hoarding. Nothing is drawn as done.
export function hoarding(project, idx, data) {
  const Wd = 1200, Ht = 300, live = liveFor(project, data), num = String(idx + 1).padStart(2, '0');
  const sc = scene(project, 230, data, { litFrac: 0.3 });
  const tx = 470, x1 = 1140;
  let t = `<rect x="430" y="34" width="734" height="232" rx="14" fill="#1b2f63" fill-opacity=".55" stroke="#8fb3ff" stroke-opacity=".35"/>`;
  t += `<g opacity=".16">` + Array.from({ length: 23 }, (_, i) => `<line x1="${430 + i * 32}" y1="34" x2="${430 + i * 32}" y2="266" stroke="#bcd3ff"/>`).join('')
    + Array.from({ length: 8 }, (_, i) => `<line x1="430" y1="${34 + i * 32}" x2="1164" y2="${34 + i * 32}" stroke="#bcd3ff"/>`).join('') + '</g>';
  t += tag(tx, 74, `No. ${num}   ${place(project)}`, { size: 13, fill: '#bcd3ff', ls: 2.6 });
  const ns = fitSize(project.name, 170, 78, 1);
  t += `<text x="${tx - 3}" y="146" class="d" font-size="${f(ns)}" fill="${PAL.cream}" letter-spacing="1" ${TL(project.name, ns, 1)}>${esc(project.name)}</text>`;
  wrapFit(project.line, x1 - (tx + 190), 14, 0.1, 3).forEach((l, i) => { t += tag(tx + 190, 104 + i * 21, l, { size: 14, fill: '#dfe8ff', ls: 0.1 }); });
  const steps = docSteps(project.line);
  if (steps) {
    const all = [...steps.design, steps.then], n = all.length, sy = 212;
    const lastW = all[n - 1].length * 9.4, gap = (x1 - tx - lastW) / Math.max(1, n - 1);
    const dx = i => tx + gap * i, dEnd = dx(steps.design.length - 1);
    t += `<line x1="${tx}" y1="${sy}" x2="${f(dx(n - 1))}" y2="${sy}" stroke="#bcd3ff" stroke-width="2" stroke-dasharray="6 6" opacity=".55"/>`;
    // the design phase as one bracket: in progress, no step claimed as finished
    t += `<path d="M${tx - 10} ${sy - 18} v-8 H${f(dEnd + 10)} v8" fill="none" stroke="#ffb347" stroke-width="1.6"/>`
      + `<circle cx="${tx + 4}" cy="${sy - 40}" r="4" fill="#ffb347" class="blink"/>` + tag(tx + 16, sy - 36, 'BEING DESIGNED NOW', { size: 11, fill: '#ffb347', ls: 2 });
    all.forEach((st, i) => {
      const x = dx(i), design = i < steps.design.length, ls = monoFit(st, gap - 18, 13, 1.4);
      t += design ? `<circle cx="${f(x)}" cy="${sy}" r="8" fill="#1b2f63" stroke="#ffb347" stroke-width="2"/><circle cx="${f(x)}" cy="${sy}" r="3" fill="#ffb347" class="pulse"/>`
        : `<circle cx="${f(x)}" cy="${sy}" r="8" fill="#1b2f63" stroke="#bcd3ff" stroke-width="2" stroke-dasharray="3 3"/>`;
      t += tag(x - 8, sy + 32, st, { size: f(ls), fill: design ? '#ffe2a6' : '#bcd3ff', ls: 1.4 });
    });
    t += tag(dx(n - 1) - 8, sy - 22, 'THEN', { size: 11, fill: '#bcd3ff', ls: 2 });
  }
  if (live.repo) t += tag(x1, 74, `PLANS UPDATED ${live.when.toUpperCase()}`, { size: 12, fill: '#bcd3ff', ls: 1.4, anchor: 'end' });
  t += `<g opacity=".85"><clipPath id="tape"><rect x="0" y="${Ht - 14}" width="${Wd}" height="14"/></clipPath><g clip-path="url(#tape)"><rect x="0" y="${Ht - 14}" width="${Wd}" height="14" fill="#ffb347"/>`
    + Array.from({ length: 62 }, (_, i) => `<path d="M${i * 20} ${Ht} l14 -14 h9 l-14 14z" fill="#2a1a3a"/>`).join('') + '</g></g>';
  const defs = frameBg(Wd, Ht, 0.2, 0.7, 'y') + SHARED_DEFS + sc.defs;
  const body = `<g clip-path="url(#fry)"><rect width="${Wd}" height="${Ht}" fill="url(#bgy)"/><rect width="${Wd}" height="${Ht}" fill="url(#gly)"/>`
    + stars(Wd, Ht, 30, 'yosr', { maxY: 140 }) + sc.svg + t + '</g>'
    + `<rect x=".75" y=".75" width="${Wd - 1.5}" height="${Ht - 1.5}" rx="23.5" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1.5"/>`;
  return svgDoc({ w: Wd, h: Ht, title: `${num} ${project.name}: ${project.kind}`, desc: project.line, css: MOTION, defs, body });
}
