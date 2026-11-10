// The census board on Census Square: an enamel street plate on top, then the real totals.
// Rows whose value is zero are left off (except contributions) so a zero is never the hero.
import { esc, P as PAL, tag, fmtNum, fmtDate, TL, ellipsize, newestWork, ago, monoW } from './svg.mjs';
import { plate } from './plate.mjs';

// [label, value, sub-label, always shown]; shared with the phone census.
export function censusRows(data) {
  const T = data.totals, cal = data.calendar || [];
  const active = cal.filter(d => d.count > 0).length;
  return [
    ['CONTRIBUTIONS', T.contributionsLastYear, 'last 12 months, all kinds', true],
    ['COMMITS', T.commitsLastYear],
    ['PULL REQUESTS', T.pullRequestsLastYear],
    ['LAST 30 DAYS', T.contributionsLast30Days],
    ['BUILDING DAYS', active, `of ${cal.length} days on the calendar`],
    ['LONGEST STREAK', T.longestStreakDays, T.longestStreakDays === 1 ? 'day' : 'days in a row'],
  ].filter(r => r[3] || r[1] > 0);
}

export function censusBoard(data, projects, { x: bx = 860, y: by = 196, w: bw = 300 } = {}) {
  const T = data.totals, rows = censusRows(data);
  const pl = plate(bx + bw / 2, by, 'census', { minW: bw, en: 25, ar: 21, shadow: false });
  let b = `<rect x="${bx}" y="${by}" width="${bw}" height="434" rx="12" fill="#140c2c" fill-opacity=".92" stroke="${PAL.cream}" stroke-opacity=".16"/>`;
  b += pl.svg;
  const y0 = by + pl.h;
  b += tag(bx + 20, y0 + 26, 'CITY CENSUS', { size: 11, fill: PAL.amber, ls: 2.2 })
    + tag(bx + bw - 20, y0 + 26, fmtDate(data.generatedAt), { size: 11, fill: PAL.mute, ls: 1.2, anchor: 'end' });
  let y = y0 + 62;
  rows.forEach(([k, v, sub], i) => {
    const val = fmtNum(v);
    b += tag(bx + 20, y, k, { size: 12, fill: PAL.lav, ls: 1.8 });
    if (sub) b += tag(bx + 20, y + 16, sub, { size: 10.5, fill: PAL.mute, ls: 0.2 });
    b += `<text x="${bx + bw - 20}" y="${y + 8}" text-anchor="end" class="d" font-size="34" fill="${i === 0 ? PAL.amber : PAL.cream}" ${TL(val, 34)}>${esc(val)}</text>`;
    b += `<line x1="${bx + 20}" y1="${y + 25}" x2="${bx + bw - 20}" y2="${y + 25}" stroke="#fff" stroke-opacity=".07"/>`;
    y += 42;
  });
  if (!T.contributionsLast30Days) {
    b += tag(bx + 20, y + 2, 'THE CITY IS RESTING', { size: 12, fill: PAL.amber, ls: 2 });
    y += 30;
  }
  const nw = newestWork(data, projects);
  if (nw) {
    const ny = Math.max(y + 10, by + 404);
    const tail = ` · ${ago(nw.repo.pushedAt, data.generatedAt).toUpperCase()}`;
    const name = ellipsize(nw.name, bw - 40 - monoW(tail, 12.5, 1) - 1, 12.5, 1);
    b += `<circle cx="${bx + 25}" cy="${ny - 4}" r="4" fill="#6dffb0" class="blink"/>` + tag(bx + 37, ny, 'NEWEST WORK', { size: 10.5, fill: '#6dffb0', ls: 1.8 });
    b += tag(bx + 20, ny + 20, name + tail, { size: 12.5, fill: PAL.cream, ls: 1 });
  }
  return b;
}
