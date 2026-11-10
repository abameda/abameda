// Phone versions of the smaller lots. Half tiles stay two to a row (the README's img width is shared
// with desktop), so each is a 288-wide portrait card: the building, then number, name, what it is
// and when the last brick was laid, all set in the display face so the file carries one font.
// The construction site becomes a full-width card with its plan as a vertical timeline.
import { svgDoc, f, P as PAL, stars, tag, monoFit } from './svg.mjs';
import { MOTION } from './motion.mjs';
import { scene, liveFor, place, SHARED_DEFS, frameBg, wrapFit, rigFor, hasRig } from './scene.mjs';
import { arrowBtn, docSteps } from './tiles.mjs';
import { MW, PAD, COL, wrapD, fitLinesD, displayBlock, cardBody } from './mobile.mjs';

export const TW = 288;
const TP = 22, TC = TW - 2 * TP;
const dtext = (x, y, text, size, fill, ls = 1.2, anchor = 'start') => displayBlock(x, y, { size, lines: [text] }, { fill, ls, anchor }).svg;

// Layout first, so every tile in the street can share the tallest tile's height.
function tileLayout(project, data) {
  const live = liveFor(project, data);
  const name = fitLinesD(project.name, TC, 58, { ls: 0.5, oneLineMin: 44 });
  const kind = { size: 24, lines: wrapD(project.kind.toUpperCase(), TC, 24, 1.2).slice(0, 3) };
  const nameH = name.size * 0.74 + (name.lines.length - 1) * name.size * 0.98;
  const kindH = kind.size * 0.74 + (kind.lines.length - 1) * kind.size * 1.14;
  const textH = 34 + 22 + nameH + 22 + kindH;
  return { live, name, kind, textH };
}
const ART = 290, FOOT = 118;
export const tileHeight = (projects, data) => Math.ceil(Math.max(...projects.map(p => ART + tileLayout(p, data).textH + FOOT)));

export function tileM(project, idx, data, Ht) {
  const L = tileLayout(project, data), num = String(idx + 1).padStart(2, '0');
  const rig = rigFor(project.key, false);
  const sc = scene(project, TW / 2, data, { litFrac: L.live.litFrac, rig: { ...rig, cy: rig.cy - (hasRig(project.key) ? 22 : 0) } }); // known lots sit a little higher
  let y = ART;
  let t = dtext(TP, y, `No. ${num}`, 24, PAL.peach, 1.4) + dtext(TP + 74, y + 2, place(project).split(' · ')[0], 20, PAL.mute, 1.2);
  const nm = displayBlock(TP - 2, y + 24 + 22, L.name, { ls: 0.5 });
  t += nm.svg;
  t += displayBlock(TP, nm.bottom + 22, L.kind, { fill: PAL.lav, ls: 1.2, lh: 1.14 }).svg;
  if (L.live.repo) {
    const by = Ht - 78;
    t += `<circle cx="${TP + 6}" cy="${by - 8}" r="6" fill="#6dffb0" class="blink"/>` + dtext(TP + 22, by - 16, 'LAST BRICK LAID', 19, PAL.lav, 1.4)
      + dtext(TP + 22, by + 12, L.live.when.toUpperCase(), 22, PAL.cream, 1.4);
  }
  t += `<g transform="translate(${TW - 48},${Ht - 50}) scale(1.25)">${arrowBtn(0, 0)}</g>`;
  const defs = frameBg(TW, Ht, 0.62, 0.24, 't') + SHARED_DEFS + sc.defs;
  const body = cardBody(TW, Ht, 't', stars(TW, Ht, 16, project.key, { maxY: 150 }) + sc.svg + t);
  return svgDoc({ w: TW, h: Ht, title: `${num} ${project.name}: ${project.kind}`, desc: project.line, css: MOTION, defs, body, fonts: { mono: false } });
}

// The construction site, portrait: the lot drawn larger, the plan pinned below it as a timeline.
export function hoardingM(project, idx, data) {
  const live = liveFor(project, data), num = String(idx + 1).padStart(2, '0');
  const sc = scene(project, MW / 2, data, { litFrac: 0.3, rig: { S: 26, plot: [6.4, 6.4], b: [1.2, 1.0], cy: 236 } });
  const BP = '#bcd3ff';
  const where = `No. ${num} · ${place(project)}`, ws = monoFit(where, COL, 20, 1.6);
  let y = 410, t = tag(PAD, y, ws >= 17 ? where : `No. ${num}`, { size: f(Math.max(17, ws)), fill: BP, ls: 1.6 });
  const nm = displayBlock(PAD - 3, y + 30, fitLinesD(project.name, COL, 116, { ls: 1, oneLineMin: 84 }));
  t += nm.svg; y = nm.bottom;
  const kd = displayBlock(PAD, y + 26, fitLinesD(project.kind.toUpperCase(), COL, 34, { ls: 2, oneLineMin: 30 }), { fill: PAL.lav, ls: 2, lh: 1.12 });
  t += kd.svg; y = kd.bottom + 22;
  // when the plan is drawn below, the copy keeps only the sentence before its list of steps
  const steps = docSteps(project.line), copy = steps ? project.line.slice(0, project.line.lastIndexOf(':')).replace(/[.,;]?$/, '.') : project.line;
  wrapFit(copy, COL, 26, 0, 6).forEach(l => { y += 37; t += tag(PAD, y, l, { size: 26, fill: '#dfe8ff', ls: 0 }); });

  // the plan, pinned to a blueprint sheet: design steps in progress (none drawn as done), then code
  if (steps) {
    const all = [...steps.design, steps.then], top = y + 40, gap = 62, x0 = PAD + 30, sy0 = top + 104;
    const panelH = 104 + (all.length - 1) * gap + 30 + 52;
    t += `<rect x="${PAD - 12}" y="${top}" width="${COL + 24}" height="${f(panelH)}" rx="14" fill="#1b2f63" fill-opacity=".55" stroke="${BP}" stroke-opacity=".35"/>`;
    t += `<g opacity=".14">` + Array.from({ length: Math.floor((COL + 24) / 34) }, (_, i) => `<line x1="${PAD - 12 + (i + 1) * 34}" y1="${top}" x2="${PAD - 12 + (i + 1) * 34}" y2="${f(top + panelH)}" stroke="${BP}"/>`).join('')
      + Array.from({ length: Math.floor(panelH / 34) }, (_, i) => `<line x1="${PAD - 12}" y1="${f(top + (i + 1) * 34)}" x2="${PAD + COL + 12}" y2="${f(top + (i + 1) * 34)}" stroke="${BP}"/>`).join('') + '</g>';
    t += `<circle cx="${x0 - 4}" cy="${top + 40}" r="6" fill="#ffb347" class="blink"/>` + tag(x0 + 14, top + 47, 'BEING DESIGNED NOW', { size: 20, fill: '#ffb347', ls: 2 });
    const nd = steps.design.length, sy = i => sy0 + i * gap + (i >= nd ? 30 : 0);
    t += `<line x1="${x0}" y1="${sy(0)}" x2="${x0}" y2="${sy(all.length - 1)}" stroke="${BP}" stroke-width="2.4" stroke-dasharray="7 7" opacity=".55"/>`;
    t += `<path d="M${x0 - 22} ${sy(0) - 16} h-8 V${sy(nd - 1) + 16} h8" fill="none" stroke="#ffb347" stroke-width="2"/>`;
    all.forEach((st, i) => {
      const design = i < nd, ls = 1.4, size = Math.max(18, monoFit(st, COL - 70, 24, ls));
      t += design ? `<circle cx="${x0}" cy="${sy(i)}" r="11" fill="#1b2f63" stroke="#ffb347" stroke-width="2.4"/><circle cx="${x0}" cy="${sy(i)}" r="4.5" fill="#ffb347" class="pulse"/>`
        : `<circle cx="${x0}" cy="${sy(i)}" r="11" fill="#1b2f63" stroke="${BP}" stroke-width="2.4" stroke-dasharray="4 4"/>`;
      if (!design) t += tag(x0 + 30, sy(i) - 24, 'THEN', { size: 17, fill: BP, ls: 2 });
      t += tag(x0 + 30, sy(i) + 8, st, { size: f(size), fill: design ? '#ffe2a6' : BP, ls });
    });
    y = top + panelH;
  }
  if (live.repo) { y += 54; t += tag(PAD, y, `PLANS UPDATED ${live.when.toUpperCase()}`, { size: 20, fill: BP, ls: 1.6 }); }
  const Ht = Math.round(y + 56);
  t += `<g opacity=".85"><clipPath id="tape"><rect x="0" y="${Ht - 16}" width="${MW}" height="16"/></clipPath><g clip-path="url(#tape)"><rect x="0" y="${Ht - 16}" width="${MW}" height="16" fill="#ffb347"/>`
    + Array.from({ length: 32 }, (_, i) => `<path d="M${i * 22} ${Ht} l16 -16 h10 l-16 16z" fill="#2a1a3a"/>`).join('') + '</g></g>';
  const defs = frameBg(MW, Ht, 0.5, 0.2, 'y') + SHARED_DEFS + sc.defs;
  const body = cardBody(MW, Ht, 'y', stars(MW, Ht, 28, 'yosr', { maxY: 200 }) + sc.svg + t);
  return svgDoc({ w: MW, h: Ht, title: `${num} ${project.name}: ${project.kind}`, desc: project.line, css: MOTION, defs, body });
}
