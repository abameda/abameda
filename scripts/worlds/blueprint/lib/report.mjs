// SHEET 04: test report, run off as a whiteprint. Weekly load histogram on graph paper,
// measured results and a revision block built from real pushes.
import { C, W, T, L, R, Ci, r2, up, svgDoc, sheet, sheetHead, hatchDefs, arrow, withPalette, WHITEPRINT } from './svg.mjs';
import { ymd, dmy, ago, monthName } from './data.mjs';
import { redNote, redArrow, redCircle } from './parts.mjs';
import { link, img } from './readme.mjs';

// Rolling 7-day windows counted back from the last calendar day, so the last bar is a full week ending now.
function weeks(cal) {
  const n = Math.floor(cal.length / 7), off = cal.length - n * 7, wk = [];
  for (let k = 0; k < n; k++) {
    const days = cal.slice(off + k * 7, off + k * 7 + 7);
    wk.push({ start: days[0].date, end: days[6].date, sum: days.reduce((a, d) => a + d.count, 0), days });
  }
  return { wk, off };
}
// axis top = 4 whole ticks, each a "nice" number
const TICKS = [1, 2, 5, 10, 15, 20, 25, 50, 75, 100, 150, 200, 250, 500, 750, 1000, 1500, 2000, 2500, 5000];
const nice = m => 4 * (TICKS.find(t => t * 4 >= m) ?? Math.ceil(m / 4000) * 1000);
const short = iso => dmy(iso).slice(0, 6).replace(/^0/, '');

// The profile repo is committed to daily by the refresh Action: it is not a project revision.
export const projectRepos = (profile, data) => (data.repos || [])
  .filter(r => r.name.toLowerCase() !== String(profile.login).toLowerCase() && (r.languages || []).length)
  .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));

function chart(x0, y0, cw, ch, data) {
  const cal = data.calendar || [], { wk, off } = weeks(cal), n = wk.length || 1;
  const max = Math.max(0, ...wk.map(w => w.sum)), top = nice(max), dx = cw / n;
  const px = i => x0 + (i + 0.5) * dx, py = v => y0 + ch - v / top * ch, base = y0 + ch;
  const dayX = j => x0 + (j - off + 0.5) / (n * 7) * cw;
  let s = `<pattern id="gp" width="${r2(dx)}" height="${r2(ch / 20)}" patternUnits="userSpaceOnUse" x="${x0}" y="${y0}"><path d="M${r2(dx)} 0H0V${r2(ch / 20)}" fill="none" stroke="${C.graph}"/></pattern>`;
  s += R(x0, y0, cw, ch, { fill: 'url(#gp)' });
  for (let k = 1; k < 4; k++) { const y = y0 + ch * k / 4; s += L(x0, y, x0 + cw, y, { c: C.faint, w: W.hair, dash: '6 4' }); }
  for (let k = 0; k <= 4; k++) { const y = base - ch * k / 4; s += L(x0 - 8, y, x0, y, { c: C.ink, w: W.thin }) + T(x0 - 13, y + 4.5, String(top * k / 4), { size: 12, fill: C.muted, anchor: 'end' }); }
  s += T(x0 - 52, y0 + ch / 2, 'CONTRIBUTIONS / WEEK', { size: 11, fill: C.muted, anchor: 'middle', rot: -90, ls: 1.2 });
  // month ticks at the real first-of-month position
  cal.forEach((d, j) => {
    if (j < off || d.date.slice(8) !== '01') return;
    const m = +d.date.slice(5, 7) - 1, x = dayX(j);
    s += L(x, base, x, base + 8, { c: C.ink, w: W.thin }) + L(x, y0, x, base, { c: C.ghost, w: W.hair });
    if (x < x0 + cw - 40) s += T(x + 4, base + 24, m === 0 ? `JAN ${d.date.slice(0, 4)}` : monthName(m), { size: 12, fill: m === 0 ? C.ink : C.muted, ls: 1 });
  });
  // last 30 days band
  const bx0 = cal.length ? dayX(Math.max(off, cal.length - 30)) - cw / (n * 14) : x0, bx1 = x0 + cw;
  s += R(bx0, y0, bx1 - bx0, ch, { fill: C.wash });
  s += L(bx0, y0 - 18, bx0, y0, { c: C.thin, w: W.hair }) + L(bx0, y0 - 12, bx1, y0 - 12, { c: C.thin, w: W.hair }) + arrow(bx1, y0 - 12, bx0, y0 - 12, { c: C.thin }) + arrow(bx0, y0 - 12, bx1, y0 - 12, { c: C.thin });
  s += T(bx0 - 10, y0 - 8, `LAST 30 DAYS  ·  ${(data.totals?.contributionsLast30Days ?? 0).toLocaleString('en-US')}`, { size: 12, fill: C.ink, anchor: 'end', ls: 1 });
  // load histogram: one hatched bar per week; a measured zero is a tick on the baseline
  const bw = Math.max(3, dx * 0.64);
  wk.forEach((w, i) => {
    if (w.sum > 0) s += `<rect x="${r2(px(i) - bw / 2)}" y="${r2(py(w.sum))}" width="${r2(bw)}" height="${r2(base - py(w.sum))}" fill="${C.sheet}"/><rect x="${r2(px(i) - bw / 2)}" y="${r2(py(w.sum))}" width="${r2(bw)}" height="${r2(base - py(w.sum))}" fill="url(#h31)" stroke="${C.ink}" stroke-width="${W.med}"/>`;
    else s += L(px(i) - bw / 2, base - 1.5, px(i) + bw / 2, base - 1.5, { c: C.thin, w: 2 });
  });
  s += L(x0, base, x0 + cw, base, { c: C.ink, w: W.thick }) + R(x0, y0, cw, ch, { c: C.ink, w: W.med });
  if (!max) s += T(x0 + cw / 2, y0 + ch / 2, 'NO PUBLIC CONTRIBUTIONS IN THIS WINDOW', { size: 13, fill: C.muted, anchor: 'middle', ls: 1.2 });
  if (!wk.length) return s;
  // pen at "now": the week ending today
  const ex = px(n - 1), ey = py(wk[n - 1].sum) - (wk[n - 1].sum ? 0 : 2);
  s += L(ex, y0, ex, base, { c: C.red, w: W.thin, dash: '4 3' }) + T(ex, base + 24, 'NOW', { size: 12, fill: C.red, anchor: 'middle', ls: 1.5 });
  s += `<circle class="pulse" cx="${r2(ex)}" cy="${r2(ey)}" r="9" fill="none" stroke="${C.red}" stroke-width="1.6"/>` + Ci(ex, ey, 4.2, { c: C.red, w: 1.6, fill: C.red });
  // busiest day (redline) on the week that contains it
  const bd = data.totals?.busiestDay, bdi = bd?.count ? wk.findIndex(w => w.days.some(d => d.date === bd.date)) : -1;
  const pk = bdi >= 0 ? bdi : wk.reduce((b, w, i) => (w.sum > wk[b].sum ? i : b), 0);
  if (max > 0) {
    const qx = px(pk), qy = py(wk[pk].sum);
    s += redCircle(qx, qy - 2, 17, 14, 5, { w: 2.2 });
    const right = qx < x0 + cw * 0.6, nx = right ? qx + 50 : qx - 300, ny = Math.max(y0 + 30, qy + 10);
    const note = bdi >= 0 ? `busiest day: ${bd.count} on ${dmy(bd.date).toLowerCase().replace(/^0/, '')}` : `peak week: ${wk[pk].sum}`;
    const halo = `paint-order="stroke" stroke="${C.sheet}" stroke-width="7" stroke-linejoin="round"`;
    const sub = `THAT WEEK: ${wk[pk].sum.toLocaleString('en-US')}  ·  ${short(wk[pk].start)} – ${short(wk[pk].end)}`;
    // paste a paper slip under the note only when bars actually run beneath it
    const bw2 = Math.max(note.length * 10.4, sub.length * 7.9) + 18;
    if (wk.some((w, i) => w.sum && px(i) > nx - 12 && px(i) < nx + bw2 && py(w.sum) < ny + 34)) s += `<rect x="${r2(nx - 8)}" y="${r2(ny - 26)}" width="${r2(bw2)}" height="58" fill="${C.sheet}" fill-opacity=".9" stroke="${C.faint}" stroke-width="${W.hair}"/>`;
    s += redNote(nx, ny, note, { size: 22, rot: -2 }).replace('<text ', `<text ${halo} `) + redArrow(right ? nx - 6 : nx + 250, ny - 10, qx + (right ? 20 : -20), qy + 2, { bow: -0.2 });
    s += T(nx + 2, ny + 24, sub, { size: 11.5, fill: C.muted, ls: 1, extra: halo });
  }
  return s;
}

// Measured results as a two-column test table. Zeros are left out; with no activity it reports recency instead.
function results(x, y, w, profile, data) {
  const t = data.totals || {}, cal = data.calendar || [], now = data.generatedAt;
  const lastActive = [...cal].reverse().find(d => d.count > 0), latest = projectRepos(profile, data)[0];
  const num = v => ({ v: v.toLocaleString('en-US'), big: true });
  let rows = t.contributionsLastYear > 0 ? [
    ['CONTRIBUTIONS, LAST 12 MONTHS', num(t.contributionsLastYear)],
    t.commitsLastYear > 0 && ['COMMITS', num(t.commitsLastYear)],
    t.pullRequestsLastYear > 0 && ['PULL REQUESTS', num(t.pullRequestsLastYear)],
    t.longestStreakDays > 1 && ['LONGEST RUN', { v: `${t.longestStreakDays} DAYS` }],
    t.currentStreakDays > 1 && ['CURRENT RUN', { v: `${t.currentStreakDays} DAYS` }],
    lastActive && ['LAST ACTIVE', { v: `${short(lastActive.date)} · ${ago(lastActive.date, now)}` }],
  ] : [
    latest && ['LATEST REVISION', { v: `${short(latest.pushedAt)} · ${ago(latest.pushedAt, now)}` }],
    t.publicRepos > 0 && ['PUBLIC REPOSITORIES', num(t.publicRepos)],
    data.user?.createdAt && ['ON GITHUB SINCE', { v: data.user.createdAt.slice(0, 4), big: true }],
  ];
  rows = rows.filter(Boolean).slice(0, 5);
  const rh = 30, vc = 200;
  let s = R(x, y, w, 26, { c: C.ink, w: W.med, fill: C.panel }) + T(x + w / 2, y + 18, 'MEASURED RESULTS', { size: 12, font: 'disp', fill: C.ink, anchor: 'middle', ls: 2 });
  rows.forEach(([k, val], i) => {
    const ry = y + 26 + i * rh;
    s += R(x, ry, w, rh, { c: C.line, w: W.thin }) + L(x + w - vc, ry, x + w - vc, ry + rh, { c: C.line, w: W.thin });
    s += T(x + 12, ry + 20, k, { size: 13, fill: C.line, ls: 0.8 });
    s += val.big ? T(x + w - 14, ry + 22.5, val.v, { size: 19, font: 'disp', fill: C.ink, anchor: 'end' }) : T(x + w - 14, ry + 20, val.v, { size: 13.5, fill: C.ink, anchor: 'end', ls: 0.4 });
  });
  if (!rows.length) s += T(x + w / 2, y + 26 + 20, 'NO MEASUREMENTS IN THIS SNAPSHOT', { size: 12, fill: C.muted, anchor: 'middle' });
  return s + R(x, y, w, 26 + Math.max(1, rows.length) * rh, { c: C.ink, w: W.thick });
}

function revisions(x, y, w, profile, data) {
  const recent = projectRepos(profile, data).slice(0, 6);
  const initials = profile.name.split(/\s+/).map(s => s[0]).join('.') + '.';
  const cols = [44, w - 44 - 118 - 56, 118, 56], rh = 29;
  let s = R(x, y, w, 26, { c: C.ink, w: W.med, fill: C.panel }) + T(x + w / 2, y + 18, 'REVISIONS', { size: 12, font: 'disp', fill: C.ink, anchor: 'middle', ls: 2 });
  const hy = y + 26; let cx = x;
  ['REV', 'DESCRIPTION  ·  REAL PUSHES', 'DATE', 'BY'].forEach((hd, i) => { s += T(i === 1 ? cx + 10 : cx + cols[i] / 2, hy + 16, hd, { size: 10, fill: C.muted, anchor: i === 1 ? null : 'middle', ls: 1 }); cx += cols[i]; });
  s += L(x, hy + 23, x + w, hy + 23, { c: C.line, w: W.thin });
  recent.forEach((r, i) => {
    const ry = hy + 23 + i * rh, letter = String.fromCharCode(64 + recent.length - i);
    const proj = profile.projects.find(p => p.repo.toLowerCase() === r.name.toLowerCase());
    const name = proj ? up(proj.name) : up(r.name.replace(/[-_.]/g, ' '));
    let xx = x;
    cols.forEach((c, j) => { if (j) s += L(xx, ry, xx, ry + rh, { c: C.line, w: W.thin }); xx += c; });
    s += L(x, ry + rh, x + w, ry + rh, { c: C.line, w: W.thin });
    s += T(x + cols[0] / 2, ry + 20, letter, { size: 14, font: 'disp', fill: C.ink, anchor: 'middle' });
    s += T(x + cols[0] + 10, ry + 20, name, { size: 14, fill: C.ink, ls: 0.4 }) + T(x + cols[0] + cols[1] - 8, ry + 19.5, up(r.primaryLanguage || ''), { size: 10.5, fill: C.muted, anchor: 'end', ls: 0.6 });
    s += T(x + cols[0] + cols[1] + cols[2] / 2, ry + 20, ymd(r.pushedAt), { size: 13, fill: i === 0 ? C.ink : C.line, anchor: 'middle' });
    s += T(x + w - cols[3] / 2, ry + 19.5, initials, { size: 11, fill: C.muted, anchor: 'middle' });
    if (i === 0) s += redCircle(x + cols[0] / 2, ry + 14, 15, 12, 3, { w: 2 }) + `<g class="blink">${redNote(x + w + 12, ry + 21, 'latest', { size: 20, rot: -4 })}</g>`;
  });
  if (!recent.length) s += T(x + w / 2, hy + 23 + 19, 'NO PUBLIC PUSHES IN THIS SNAPSHOT', { size: 12, fill: C.muted, anchor: 'middle', ls: 1 });
  return s + R(x, y, w, 26 + 23 + Math.max(1, recent.length) * rh, { c: C.ink, w: W.thick });
}

export function build(profile, data, ctx, emit) {
  const w = 1200, h = 640, now = data.generatedAt, t = data.totals || {};
  const svg = withPalette(WHITEPRINT, () => {
    const sh = sheet(w, h, { nx: 8, ny: 4, edge: true });
    let b = sh.body;
    b += sheetHead(54, 50, '04', 'TEST REPORT', `WHITEPRINT  ·  LIVE FROM GITHUB  ·  ${ymd(now)}`);
    b += results(56, 122, 540, profile, data);
    b += revisions(650, 50, 446, profile, data);
    b += chart(124, 344, 1004, 190, data);
    b += T(124, 600, 'LOAD HISTOGRAM  ·  CONTRIBUTIONS PER 7-DAY WINDOW ENDING TODAY, TRAILING 12 MONTHS', { size: 11.5, fill: C.muted, ls: 1.2 });
    b += T(1128, 600, `SPECIMEN @${up(profile.login)}`, { size: 11.5, fill: C.muted, anchor: 'end', ls: 1.2 });
    const css = `@keyframes pulse{0%{transform:scale(.6);opacity:1}100%{transform:scale(2.2);opacity:0}}.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 2.4s ease-out infinite}` +
      `@keyframes blink{0%,100%{opacity:1}50%{opacity:.55}}.blink{animation:blink 3s ease-in-out infinite}`;
    return svgDoc({
      w, h, title: 'Test report: live GitHub activity',
      desc: `${t.contributionsLastYear ?? 0} contributions in the last 12 months, ${t.contributionsLast30Days ?? 0} in the last 30 days. Latest pushes: ${projectRepos(profile, data).slice(0, 3).map(r => `${r.name} on ${ymd(r.pushedAt)}`).join(', ') || 'none'}.`,
      fonts: ['disp', 'mono', 'hand'], css, defs: sh.defs + hatchDefs(C.line, 0.6), body: b,
    });
  });
  emit('report.svg', svg);
  ctx.md ??= [];
  ctx.md.push(`<p align="center">${link(profile.links.github, img('report.svg', `Test report: ${t.contributionsLastYear ?? 0} contributions in the last 12 months, ${t.contributionsLast30Days ?? 0} in the last 30 days, plotted per week; revision table of the latest project pushes.`))}</p>`);
}
