// Phone census: headline, the same district drawn across the column (larger month names on the
// avenue), the two callouts re-placed for the narrow frame, then the census board as a 2 x 3 grid
// under its enamel plate. Live: every tower, the callouts, every number and the newest-work line.
import { svgDoc, f, esc, P as PAL, tag, fmtNum, fmtDate, TL, monoFit, ellipsize, newestWork, ago, monoW } from './svg.mjs';
import { iso } from './iso.mjs';
import { MOTION } from './motion.mjs';
import { district, FLOOR, BASE } from './activity.mjs';
import { censusRows } from './board.mjs';
import { plate } from './plate.mjs';
import { fitSize } from './scene.mjs';
import { MW, PAD, COL } from './mobile.mjs';

const S = 10.2, CAP = 170 * 1024; // lower than desktop: the phone set has its own weight budget

// Where the district's highest roof lands relative to its origin, so the headline never meets it.
function topOf(data) {
  const cal = data.calendar || [], w0 = cal.length ? cal[0].weekday : 0, max = Math.max(1, ...cal.map(d => d.count));
  const unit = Math.max(1, Math.ceil(max / 40));
  return Math.min(-0.6 * S, ...cal.map((d, i) => d.count ? (Math.floor((i + w0) / 7) + ((i + w0) % 7) + 0.26) * 0.5 * S - (BASE + Math.ceil(d.count / unit) * FLOOR) * S : 0));
}

function render(data, projects, lite) {
  // headline in the sky
  let t = tag(PAD, 58, 'THE LAST 12 MONTHS, BUILT DAY BY DAY', { size: f(Math.min(19, monoFit('THE LAST 12 MONTHS, BUILT DAY BY DAY', COL, 19, 2))), fill: PAL.peach, ls: 2 });
  const max = Math.max(1, ...(data.calendar || []).map(d => d.count)), unit = Math.max(1, Math.ceil(max / 40));
  const head = unit === 1 ? 'ONE FLOOR PER CONTRIBUTION' : `ONE FLOOR PER ${unit} CONTRIBUTIONS`, hs = fitSize(head, COL, 64, 1);
  t += `<text x="${PAD - 2}" y="${f(80 + hs * 0.74)}" class="d" font-size="${f(hs)}" fill="${PAL.cream}" letter-spacing="1" ${TL(head, hs, 1)}>${head}</text>`;
  const sub = 'every lot is a day; open ground is a rest day', subY = 80 + hs * 0.74 + 40;
  t += tag(PAD, subY, sub, { size: f(Math.min(20, monoFit(sub, COL, 20, 0.2))), fill: PAL.lav, ls: 0.2 });

  // the district, as wide as the column allows
  const cal = data.calendar || [], w0 = cal.length ? cal[0].weekday : 0, cols = Math.max(1, Math.ceil((cal.length + w0) / 7));
  const ox = PAD - 14 + 8.14 * S, oy = Math.round(subY + 36 - topOf(data));
  const D = district(data, lite, { ox, oy, S, ml: { size: '1.55', y: '1.06', yr: '1.05' } });
  let s = D.s;
  if (D.busiest) {
    const b = D.busiest, [px, py] = D.I.P(b.c + 0.5, b.r + 0.5, BASE + D.floors(b.count) * FLOOR);
    const l1 = `${fmtNum(b.count)} CONTRIBUTIONS`, l2 = `busiest day, ${fmtDate(b.date).toLowerCase()}`;
    const w = Math.max(monoW(l1, 20, 1.6), monoW(l2, 18, 0.4));
    // the label goes where it covers no tower, no ground and not the headline: beside the roof, then lower, then higher
    const towers = cal.map((d, i) => d.count ? [D.I.P(Math.floor((i + w0) / 7) + 0.5, (i + w0) % 7 + 0.5, BASE + D.floors(d.count) * FLOOR), D.I.P(Math.floor((i + w0) / 7) + 0.5, (i + w0) % 7 + 0.5, 0)] : null).filter(Boolean);
    const onSlab = (sx, sy) => { const a = (sx - ox) / (0.866 * S), c = (sy - oy) / (0.5 * S), wx = (a + c) / 2, wy = (c - a) / 2; return wx > -0.6 && wx < cols + 0.6 && wy > -0.6 && wy < 8.8; };
    const box = (side, dy) => { const lx = px + side * 30, ly = py + dy, x0 = side > 0 ? lx + 8 : lx - 8 - w; return { side, lx, ly, x0, x1: x0 + w, y0: ly - 26, y1: ly + 28 }; };
    const free = q => q.x0 > 16 && q.x1 < MW - 16 && q.y0 > subY + 26
      && !towers.some(([[tx, ty], [, by]]) => tx > q.x0 - 8 && tx < q.x1 + 8 && by > q.y0 && ty < q.y1)
      && ![[q.x0, q.y0], [q.x1, q.y0], [q.x0, q.y1], [q.x1, q.y1], [(q.x0 + q.x1) / 2, q.y1], [(q.x0 + q.x1) / 2, q.y0]].some(([sx, sy]) => onSlab(sx, sy));
    const tries = [-6, 30, -44, 64, -84, -124, -164].flatMap(dy => [box(1, dy), box(-1, dy)]);
    const pick = tries.find(free) || tries.find(q => q.x0 > 16 && q.x1 < MW - 16 && q.y0 > subY + 26) || tries[0];
    const { lx, ly } = pick, side = pick.side, tx = lx + side * 8, anchor = side > 0 ? 'start' : 'end';
    s += `<path d="M${f(px)} ${f(py)} L${f(lx)} ${f(ly)}" stroke="${PAL.amber}" stroke-width="1.6" fill="none"/><circle cx="${f(px)}" cy="${f(py)}" r="4" fill="${PAL.amber}"/>`
      + tag(tx, ly - 6, l1, { size: 20, fill: PAL.amber, ls: 1.6, anchor }) + tag(tx, ly + 20, l2, { size: 18, fill: PAL.lav, ls: 0.4, anchor });
  }
  // legend under the slab; TODAY hangs below the slab's front corner, on the legend's first row
  const slabBottom = oy + (cols + 0.6 + 8.8) * 0.5 * S + 0.7 * S;
  let y = slabBottom + 58;
  if (D.today) {
    const td = D.today, [px, py] = D.I.P(td.c + 0.5, td.r + 0.5, BASE + D.floors(td.count) * FLOOR + 0.1);
    s += `<circle cx="${f(px)}" cy="${f(py)}" r="11" fill="none" stroke="#6dffb0" stroke-width="2" class="pulse"/>`
      + `<line x1="${f(px)}" y1="${f(py + 11)}" x2="${f(px)}" y2="${f(y - 22)}" stroke="#6dffb0" stroke-width="1.6"/>`
      + tag(Math.min(px + 30, MW - 22), y, 'TODAY', { size: 20, fill: '#6dffb0', ls: 1.6, anchor: 'end' });
  }
  const lg = iso(PAD + 12, y - 22, 20, 'lg');
  t += lg.box(0, 0, 0, 0.74, 0.74, BASE + FLOOR, '#8a5a9a') + `<g transform="${lg.mLeft(0, 0.74, BASE + FLOOR)}"><rect x=".12" y=".09" width=".5" height=".13" fill="${PAL.amber}"/></g><g transform="${lg.mRight(0.74, 0.74, BASE + FLOOR)}"><rect x=".12" y=".09" width=".5" height=".13" fill="${PAL.amber}"/></g>`;
  t += tag(PAD + 46, y, unit === 1 ? '1 FLOOR = 1 CONTRIBUTION' : `1 FLOOR = ${unit} CONTRIBUTIONS`, { size: 19, fill: PAL.lav, ls: 1.4 });
  y += 40;
  t += `<rect x="${PAD}" y="${f(y - 11)}" width="150" height="11" rx="5.5" fill="url(#age)"/>` + tag(PAD + 168, y, 'OLDER TO RECENT', { size: 19, fill: PAL.lav, ls: 1.4 });

  // the census board: plate, then the totals as a grid; zero rows are already left out
  const bx = PAD - 12, bw = COL + 24, by = y + 40, rows = censusRows(data), T = data.totals;
  const pl = plate(MW / 2, by, 'census', { minW: bw, en: 32, ar: 26, shadow: false });
  let b = pl.svg, gy = by + pl.h + 44;
  b += tag(PAD + 4, gy, 'CITY CENSUS', { size: 19, fill: PAL.amber, ls: 2 }) + tag(PAD + COL - 4, gy, fmtDate(data.generatedAt), { size: 19, fill: PAL.mute, ls: 1.2, anchor: 'end' });
  gy += 30;
  const cw = (COL - 8) / 2;
  rows.forEach(([k, v, sub], i) => {
    const cx = PAD + 4 + (i % 2) * (cw + 8), cy = gy + Math.floor(i / 2) * 128, val = fmtNum(v), vs = fitSize(val, cw - 10, 64, 0);
    if (i % 2 === 0) b += `<line x1="${PAD + 4}" y1="${cy}" x2="${PAD + COL - 4}" y2="${cy}" stroke="#fff" stroke-opacity=".09"/>`;
    b += tag(cx, cy + 34, k, { size: f(Math.min(19, monoFit(k, cw - 10, 19, 1.6))), fill: PAL.lav, ls: 1.6 });
    b += `<text x="${cx - 2}" y="${cy + 92}" class="d" font-size="${f(vs)}" fill="${i === 0 ? PAL.amber : PAL.cream}" ${TL(val, vs)}>${esc(val)}</text>`;
    if (sub) b += tag(cx, cy + 116, sub, { size: f(Math.min(17, monoFit(sub, cw - 10, 17, 0.2))), fill: PAL.mute, ls: 0.2 });
  });
  gy += Math.ceil(rows.length / 2) * 128;
  if (!T.contributionsLast30Days) { gy += 34; b += tag(PAD + 4, gy, 'THE CITY IS RESTING', { size: 20, fill: PAL.amber, ls: 2 }); }
  const nw = newestWork(data, projects);
  if (nw) {
    gy += 46;
    const tail = ` · ${ago(nw.repo.pushedAt, data.generatedAt).toUpperCase()}`, name = ellipsize(nw.name, COL - 8 - monoW(tail, 22, 1), 22, 1);
    b += `<circle cx="${PAD + 10}" cy="${gy - 6}" r="6" fill="#6dffb0" class="blink"/>` + tag(PAD + 26, gy, 'NEWEST WORK', { size: 18, fill: '#6dffb0', ls: 1.8 });
    gy += 36; b += tag(PAD + 4, gy, name + tail, { size: 22, fill: PAL.cream, ls: 1 });
  }
  const bh = gy + 30 - by, Ht = Math.round(by + bh + 24);
  b = `<rect x="${bx}" y="${f(by)}" width="${bw}" height="${f(bh)}" rx="12" fill="#140c2c" fill-opacity=".92" stroke="${PAL.cream}" stroke-opacity=".16"/>` + b;

  const defs = `<clipPath id="fra"><rect width="${MW}" height="${Ht}" rx="24"/></clipPath>
<linearGradient id="bga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140b2e"/><stop offset=".7" stop-color="#26144a"/><stop offset="1" stop-color="#3d1d58"/></linearGradient>
<linearGradient id="age"><stop offset="0" stop-color="#4d3f8f"/><stop offset="1" stop-color="#e0607a"/></linearGradient>
<radialGradient id="gla" cx=".55" cy=".4" r=".6"><stop offset="0" stop-color="#ff8a6b" stop-opacity=".2"/><stop offset="1" stop-color="#ff8a6b" stop-opacity="0"/></radialGradient>${D.defs}`;
  const body = `<g clip-path="url(#fra)"><rect width="${MW}" height="${Ht}" fill="url(#bga)"/><rect width="${MW}" height="${Ht}" fill="url(#gla)"/>${s}${t}${b}</g>`
    + `<rect x=".75" y=".75" width="${MW - 1.5}" height="${Ht - 1.5}" rx="23.5" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1.5"/>`;
  return svgDoc({
    w: MW, h: Ht, title: 'Census Square: a year of contributions as a city district',
    desc: `${T.contributionsLastYear} contributions in the last year (${T.commitsLastYear} commits, ${T.pullRequestsLastYear} pull requests), ${T.contributionsLast30Days} in the last 30 days, longest streak ${T.longestStreakDays} days.`,
    css: MOTION, defs, body, fonts: { arabic: true },
  });
}

export function activityM(data, projects = []) {
  const full = render(data, projects, false);
  return Buffer.byteLength(full) <= CAP ? full : render(data, projects, true);
}
