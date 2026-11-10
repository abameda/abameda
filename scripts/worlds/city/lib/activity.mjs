// Census Square: the contribution calendar as a city district. Each day is a lot; each
// contribution is one floor. Rest days stay open ground. Warmer towers are more recent.
// Weight stays flat as he gets busier: floor bands are one patterned rect per face, not one per floor.
import { svgDoc, f, P as PAL, mix, tag, fmtDate, MONTHS, rng, TL, monoW } from './svg.mjs';
import { iso } from './iso.mjs';
import { MOTION } from './motion.mjs';
import { tree } from './buildings-b.mjs';
import { displayWidth } from './metrics.mjs';
import { censusBoard } from './board.mjs';

export const FLOOR = 0.3, BASE = 0.16;
const BUCKETS = 10, CAP = 250 * 1024;
const Wd = 1200, Ht = 660;
const HEADLINE = { x0: 455, y1: 172 }, BOARD = { x0: 846, y0: 186 };

// The phone census draws the same district at its own origin and scale, with larger month names.
export function district(data, lite, { ox = 156, oy = 200, S = 14.2, ml = { size: '1.05', y: '.9', yr: '.72' } } = {}) {
  const cal = data.calendar || [], w0 = cal.length ? cal[0].weekday : 0;
  const cols = Math.max(1, Math.ceil((cal.length + w0) / 7));
  const I = iso(ox, oy, S, 'a');
  const cells = cal.map((d, i) => ({ ...d, c: Math.floor((i + w0) / 7), r: (i + w0) % 7, i }));
  const max = Math.max(1, ...cal.map(d => d.count)), last = cal.length - 1;
  // one floor per contribution; on a very busy year a floor stands for several, so towers stay on the page
  const unit = Math.max(1, Math.ceil(max / 40)), floors = c => Math.ceil(c / unit);
  const r = rng('census');

  let s = I.box(-0.6, -0.6, -0.7, cols + 1.2, 9.4, 0.38, '#24173a', { top: false }) + I.box(-0.6, -0.6, -0.32, cols + 1.2, 9.4, 0.32, '#4c2f62', { top: false });
  s += I.topFace(-0.6, -0.6, 0, cols + 1.2, 9.4, '#3a2a58');
  s += I.topFace(-0.6, 7.25, 0.01, cols + 1.2, 1.55, '#241a3e');

  // Month names painted on the avenue. A leading part-month is dropped when the next 1st is close,
  // so every real month boundary gets its name; a month that appears twice carries its year.
  const firsts = cells.filter(d => d.date.endsWith('-01'));
  const labels = cells.length && !cells[0].date.endsWith('-01') && (!firsts.length || firsts[0].c - cells[0].c >= 4) ? [cells[0], ...firsts] : firsts;
  const mon = d => MONTHS[+d.date.slice(5, 7) - 1], seen = {};
  labels.forEach(d => { seen[mon(d)] = (seen[mon(d)] || 0) + 1; });
  labels.forEach(d => {
    const yr = seen[mon(d)] > 1 ? `<tspan font-size="${ml.yr}" dx=".08">’${d.date.slice(2, 4)}</tspan>` : '';
    s += `<g transform="${I.mTop(d.c + 0.1, 7.55, 0.02)}"><text x="0" y="${ml.y}" class="m" font-size="${ml.size}" fill="#d8c8f5" opacity=".82" letter-spacing=".1">${mon(d)}${yr}</text></g>`;
    if (d.i) s += `<g transform="${I.mTop(d.c, -0.45, 0.015)}"><line x1="0" y1="0" x2="0" y2="7.6" stroke="#8a72b8" stroke-width=".05" stroke-dasharray=".25 .25" opacity=".6"/></g>`;
  });

  // floor-band patterns, one per warmth bucket, in face-local units (one tile = one floor)
  let pats = '';
  const used = new Set();
  const order = cells.slice().sort((a, b) => a.c + a.r - (b.c + b.r) || a.c - b.c);
  let towers = '', busiest = null, today = null;
  for (const d of order) {
    const x = d.c + 0.13, y = d.r + 0.13, age = Math.min(1, (last - d.i) / 365);
    if (d.i === last) today = d;
    if (d.count === 0) {
      towers += I.topFace(x, y, 0.02, 0.74, 0.74, '#43305f');
      if (r() < 0.05) towers += tree(I, x + 0.37, y + 0.37, 0.5);
      continue;
    }
    const fl = floors(d.count), h = BASE + fl * FLOOR, warmth = Math.pow(1 - age, 2.2);
    const old = lite && age > 0.5;
    towers += I.box(x, y, 0, 0.74, 0.74, h, mix('#4d3f8f', '#e0607a', warmth), { lite: old });
    if (!old) {
      const k = Math.min(BUCKETS - 1, Math.floor(warmth * BUCKETS));
      used.add(k);
      const band = `<rect x=".12" y="0" width=".5" height="${f(fl * FLOOR)}" fill="url(#fb${k})"/>`;
      towers += `<g transform="${I.mLeft(x, y + 0.74, h)}">${band}</g><g transform="${I.mRight(x + 0.74, y + 0.74, h)}">${band}</g>`;
    }
    if (!busiest || d.count > busiest.count) busiest = d;
  }
  for (const k of used) {
    const lit = mix('#8f7cc0', '#ffc463', Math.min(1, ((k + 0.5) / BUCKETS) * 1.4 + 0.15));
    pats += `<pattern id="fb${k}" width="1" height="${FLOOR}" patternUnits="userSpaceOnUse"><rect y=".09" width="1" height=".13" fill="${lit}"/></pattern>`;
  }
  s += towers;
  return { s, I, defs: I.defs + pats, busiest, today, unit, floors, cols };
}

// Leader-line label that never runs under the headline, the census board or off the frame.
function callout([px, py], l1, l2, col) {
  const w = Math.max(monoW(l1, 13, 1.6), l2 ? monoW(l2, 12, 0.6) : 0);
  const blocked = (x0, x1, y0, y1) => x0 < 24 || x1 > Wd - 24 || y0 < 24 || (x1 > BOARD.x0 && y1 > BOARD.y0) || (x1 > HEADLINE.x0 && y0 < HEADLINE.y1);
  const tries = [];
  for (const dy of [-36, -60, -84]) for (const side of [1, -1]) tries.push([side * 18, dy, side]);
  let pick = tries[0];
  for (const t of tries) {
    const x = px + t[0], y = py + t[1], x0 = t[2] > 0 ? x + 6 : x - 6 - w, x1 = x0 + w;
    if (!blocked(x0, x1, y - 22, y + 14)) { pick = t; break; }
  }
  const [dx, dy, side] = pick, x = px + dx, y = py + dy, anchor = side > 0 ? 'start' : 'end', tx = x + side * 6;
  return `<line x1="${f(px)}" y1="${f(py)}" x2="${f(x)}" y2="${f(y)}" stroke="${col}" stroke-width="1.2"/><circle cx="${f(px)}" cy="${f(py)}" r="3" fill="${col}"/>`
    + tag(tx, y - 8, l1, { size: 13, fill: col, ls: 1.6, anchor }) + (l2 ? tag(tx, y + 10, l2, { size: 12, fill: PAL.lav, ls: 0.6, anchor }) : '');
}

function render(data, projects, lite) {
  const D = district(data, lite);
  let s = D.s;
  if (D.busiest) {
    const b = D.busiest, top = D.I.P(b.c + 0.5, b.r + 0.5, BASE + D.floors(b.count) * FLOOR);
    s += callout(top, `${b.count} CONTRIBUTIONS`, `busiest day, ${fmtDate(b.date).toLowerCase()}`, PAL.amber);
  }
  if (D.today) {
    const t = D.today, pt = D.I.P(t.c + 0.5, t.r + 0.5, BASE + D.floors(t.count) * FLOOR + 0.1);
    s += `<circle cx="${f(pt[0])}" cy="${f(pt[1])}" r="9" fill="none" stroke="#6dffb0" stroke-width="1.5" class="pulse"/>`
      + `<line x1="${f(pt[0] + 6)}" y1="${f(pt[1] + 7)}" x2="${f(pt[0] + 20)}" y2="${f(pt[1] + 24)}" stroke="#6dffb0" stroke-width="1.2"/>`
      + tag(pt[0] + 24, pt[1] + 30, 'TODAY', { size: 13, fill: '#6dffb0', ls: 1.6 });
  }
  // headline in the open sky above the district
  let t = tag(470, 70, 'THE LAST 12 MONTHS, BUILT DAY BY DAY', { size: 13, fill: PAL.peach, ls: 2.6 });
  const head = D.unit === 1 ? 'ONE FLOOR PER CONTRIBUTION' : `ONE FLOOR PER ${D.unit} CONTRIBUTIONS`, hs = Math.min(56, (56 * 690) / displayWidth(head, 56, 1));
  t += `<text x="467" y="128" class="d" font-size="${f(hs)}" fill="${PAL.cream}" letter-spacing="1" ${TL(head, hs, 1)}>${head}</text>`;
  t += tag(470, 158, 'every lot is a day; open ground is a rest day', { size: 13, fill: PAL.lav, ls: 0.4 });
  // legend: a one-floor sample block and the age ramp
  const lg = iso(80, 566, 14, 'lg');
  t += lg.box(0, 0, 0, 0.74, 0.74, BASE + FLOOR, '#8a5a9a') + `<g transform="${lg.mLeft(0, 0.74, BASE + FLOOR)}"><rect x=".12" y=".09" width=".5" height=".13" fill="${PAL.amber}"/></g><g transform="${lg.mRight(0.74, 0.74, BASE + FLOOR)}"><rect x=".12" y=".09" width=".5" height=".13" fill="${PAL.amber}"/></g>`;
  t += tag(108, 570, D.unit === 1 ? '1 FLOOR = 1 CONTRIBUTION' : `1 FLOOR = ${D.unit} CONTRIBUTIONS`, { size: 11.5, fill: PAL.lav, ls: 1.4 });
  t += `<rect x="62" y="600" width="140" height="8" rx="4" fill="url(#age)"/>` + tag(214, 608, 'OLDER  TO  RECENT', { size: 11.5, fill: PAL.lav, ls: 1.4 });

  const board = censusBoard(data, projects, { x: 860, y: 196, w: 300 });
  const defs = `<clipPath id="fra"><rect width="${Wd}" height="${Ht}" rx="24"/></clipPath>
<linearGradient id="bga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140b2e"/><stop offset=".7" stop-color="#26144a"/><stop offset="1" stop-color="#3d1d58"/></linearGradient>
<linearGradient id="age"><stop offset="0" stop-color="#4d3f8f"/><stop offset="1" stop-color="#e0607a"/></linearGradient>
<radialGradient id="gla" cx=".55" cy=".85" r=".6"><stop offset="0" stop-color="#ff8a6b" stop-opacity=".22"/><stop offset="1" stop-color="#ff8a6b" stop-opacity="0"/></radialGradient>${D.defs}`;
  const body = `<g clip-path="url(#fra)"><rect width="${Wd}" height="${Ht}" fill="url(#bga)"/><rect width="${Wd}" height="${Ht}" fill="url(#gla)"/>${s}${t}${board}</g>`
    + `<rect x=".75" y=".75" width="${Wd - 1.5}" height="${Ht - 1.5}" rx="23.5" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1.5"/>`;
  const T = data.totals;
  return svgDoc({
    w: Wd, h: Ht, title: 'Census Square: a year of contributions as a city district',
    desc: `${T.contributionsLastYear} contributions in the last year (${T.commitsLastYear} commits, ${T.pullRequestsLastYear} pull requests), ${T.contributionsLast30Days} in the last 30 days, longest streak ${T.longestStreakDays} days.`,
    css: MOTION, defs, body, fonts: { arabic: true },
  });
}

// Full detail first; if a very busy year pushes the file past the cap, older towers go plain.
export function activity(data, projects = []) {
  const full = render(data, projects, false);
  if (Buffer.byteLength(full) <= CAP) return full;
  const lite = render(data, projects, true);
  console.warn(`census: ${(Buffer.byteLength(full) / 1024).toFixed(0)} KB, simplified older towers to ${(Buffer.byteLength(lite) / 1024).toFixed(0)} KB`);
  return lite;
}
