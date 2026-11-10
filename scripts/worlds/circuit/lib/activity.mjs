// Live activity: a logic-analyzer capture of his real contribution calendar.
// CH0-CH6 are the weekdays (high = contributed that day); A0 is contributions per week.
import { C, doc, text, fit, tw, board, busLines, tp, r1, BLOCK, blockTop, blockSides, blockBottom } from './svg.mjs';
import { humanDate, monthName, stats } from './data.mjs';

export function smooth(pts, hi = -1e9, lo = 1e9) {
  if (pts.length < 2) return pts.length ? `M${r1(pts[0][0])} ${r1(pts[0][1])}` : '';
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  const cl = y => Math.min(lo, Math.max(hi, y));
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += `C${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(cl(p1[1] + (p2[1] - p0[1]) / 6))} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(cl(p2[1] - (p3[1] - p1[1]) / 6))} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d;
}

export function activity(profile, D, { G = 0 } = {}) {
  const W = 1200, H = 806, S = { x: 100, y: 64, w: 1000, h: 712 };
  const X0 = 250, X1 = 1068;
  const weeks = D.weeks.length ? D.weeks : [{ start: D.ref, days: [], total: 0 }];
  const dx = (X1 - X0) / weeks.length;
  const A = { y: 160, h: 112 }, CH = { y: 304, h: 30 };
  const top = A.y - 14, bot = CH.y + 7 * CH.h + 8;
  const st = stats(D);
  const maxWeek = Math.max(0, ...weeks.map(w => w.total)), peakDay = Math.max(1, D.peak?.count || 0);

  let g = board(W, H) + busLines(H, { G }) + blockSides(34, H - 16) + blockBottom(H - 16, BLOCK.L, BLOCK.R);
  g += blockTop(34, BLOCK.L, BLOCK.R, '04', 'LOGIC ANALYZER', 'LIVE CAPTURE · RE-SAMPLED DAILY');
  g += `<rect x="${S.x}" y="${S.y}" width="${S.w}" height="${S.h}" rx="10" fill="#060807" stroke="#232926" stroke-width="1.5"/>`;
  g += `<circle cx="${S.x + 28}" cy="96" r="5" fill="${C.sig}" class="blink"/>` + text(S.x + 44, 102, 'LA-1', { size: 18, ls: 2.4, fill: C.silk });
  g += text(S.x + 112, 102, `CH0–CH6 = SUN–SAT · 1 SAMPLE = 1 DAY · ${weeks.length} WEEKS`, { size: 15, ls: 1.3, fill: C.dim });
  g += text(S.x + S.w - 24, 102, `SAMPLED ${humanDate(D.ref)}`, { size: 15, ls: 1.3, fill: C.gold, anchor: 'end' });
  g += `<path d="M${S.x + 20} 118H${S.x + S.w - 20}" stroke="#1D2220"/>`;

  for (let i = 0; i <= 10; i++) { const x = r1(X0 + (X1 - X0) * i / 10); g += `<path d="M${x} ${top}V${bot}" stroke="#161B19" stroke-dasharray="2 4"/>`; }
  [A.y, A.y + A.h / 2, A.y + A.h].forEach(y => (g += `<path d="M${X0} ${y}H${X1}" stroke="#161B19" stroke-dasharray="2 4"/>`));

  // A0: contributions per week (smoothed trace with phosphor fill)
  g += text(S.x + 22, A.y + 8, 'A0', { size: 18, ls: 2, fill: C.gold }) + text(S.x + 22, A.y + 32, 'PER WEEK', { size: 14, ls: 1.2, fill: C.dim });
  if (maxWeek) g += text(X0 - 12, A.y + 6, st.n(maxWeek), { size: 14, fill: C.dim, anchor: 'end' }) + text(X0 - 12, A.y + A.h + 4, '0', { size: 14, fill: C.dim, anchor: 'end' });
  const ap = weeks.map((w, i) => [X0 + dx * (i + 0.5), A.y + A.h - (maxWeek ? w.total / maxWeek : 0) * A.h]);
  const ad = smooth(ap, A.y, A.y + A.h);
  g += `<linearGradient id="ph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.sig}" stop-opacity=".3"/><stop offset="1" stop-color="${C.sig}" stop-opacity="0"/></linearGradient>`;
  if (ap.length > 1) g += `<path d="${ad}L${r1(ap[ap.length - 1][0])} ${A.y + A.h}L${r1(ap[0][0])} ${A.y + A.h}Z" fill="url(#ph)"/>`;
  g += `<path d="${ad}" fill="none" stroke="${C.sig}" stroke-width="6" opacity=".14"/><path d="${ad}" fill="none" stroke="${C.sig}" stroke-width="2"/>`;

  // CH0-CH6: one logic channel per weekday; days after today are drawn as not-yet-sampled
  const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  for (let k = 0; k < 7; k++) {
    const y0 = CH.y + k * CH.h, hi = y0 + 6, lo = y0 + CH.h - 6, busy = st.busiest && st.busiest.wd === k;
    g += tp(S.x + 30, y0 + CH.h / 2, 4) + text(S.x + 48, y0 + CH.h / 2 + 5, `CH${k} ${DAYS[k]}`, { size: 15, ls: 1.2, fill: busy ? C.gold : C.silk2 });
    if (busy) g += `<path d="M${S.x + 140} ${y0 + CH.h / 2 - 5}l8 5-8 5z" fill="${C.gold}"/>`;
    let d = '', fills = '', lastX = X0;
    weeks.forEach((w, i) => {
      const day = w.days.find(dd => dd.weekday === k); if (!day) return;
      const x = X0 + dx * i, y = day.count > 0 ? hi : lo;
      d += (d ? 'L' : 'M') + `${r1(x)} ${y}L${r1(x + dx)} ${y}`; lastX = x + dx;
      if (day.count > 0) fills += `<rect x="${r1(x)}" y="${hi}" width="${r1(dx)}" height="${lo - hi}" fill="${busy ? C.gold : C.sig}" opacity="${r1(0.12 + 0.5 * Math.min(1, day.count / peakDay))}"/>`;
    });
    if (lastX < X1 - 1) g += `<rect x="${r1(lastX + 2)}" y="${hi}" width="${r1(X1 - lastX - 2)}" height="${lo - hi}" fill="url(#hatch)"/>`;
    g += fills + `<path d="${d}" fill="none" stroke="${busy ? C.gold : C.sig}" stroke-width="1.6" stroke-linejoin="round" opacity=".95"/>`;
  }
  g += `<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V6" stroke="${C.dim}" stroke-opacity=".35" stroke-width="1.2"/></pattern>`;

  // time axis: month ticks
  let lastM = -1, lastEnd = -1e9;
  weeks.forEach((w, i) => {
    const m = +String(w.start).slice(5, 7) - 1; if (m === lastM) return; lastM = m;
    const x = X0 + dx * i, lab = monthName(m) + (m === 0 ? ` ${String(w.start).slice(2, 4)}` : '');
    if (x > X1 - 40 || x < lastEnd + 10) return;
    lastEnd = x + 4 + tw(lab, 14, 'M', 1);
    g += `<path d="M${r1(x)} ${bot}V${bot + 7}" stroke="${C.dim}"/>` + text(x + 4, bot + 26, lab, { size: 14, ls: 1, fill: C.dim });
  });

  // cursors: peak day, last edge, and the NOW trigger at the end of the capture
  const cursor = (date, label, col, end) => {
    const i = weeks.findIndex(w => w.days.some(d => d.date === date)); if (i < 0) return '';
    const x = r1(X0 + dx * (i + 0.5)), lw = tw(label, 15, 'M', 1.2) + 18, lx = end ? x - lw : x;
    return `<path d="M${x} ${top - 6}V${bot}" stroke="${col}" stroke-width="1.3" stroke-dasharray="5 4" opacity=".85"/><rect x="${r1(lx)}" y="${top - 30}" width="${r1(lw)}" height="24" rx="2" fill="${col}"/>` + text(lx + 9, top - 12, label, { size: 15, ls: 1.2, fill: C.board });
  };
  if (D.peak?.count) g += cursor(D.peak.date, `PEAK ${st.n(D.peak.count)} · ${humanDate(D.peak.date)}`, C.gold, false);
  if (D.lastActive && st.lastN > 3) g += cursor(D.lastActive, `LAST EDGE`, C.silk, true);
  g += `<path d="M${X1} ${top - 6}V${bot}" stroke="${C.sig}" stroke-width="2"/><path d="M${X1 - 7} ${top - 14}h14l-7 8z" fill="${C.sig}"/>` + text(X1 + 8, top - 6, 'NOW', { size: 14, ls: 1.2, fill: C.sig });

  // sweep beam (life on top of a complete capture)
  g += `<linearGradient id="sw" x1="0" x2="1"><stop offset="0" stop-color="${C.sig}" stop-opacity="0"/><stop offset="1" stop-color="${C.sig}" stop-opacity=".16"/></linearGradient>`;
  g += `<g class="sweep"><rect x="${X0 - 90}" y="${top}" width="90" height="${bot - top}" fill="url(#sw)"/><path d="M${X0} ${top}V${bot}" stroke="${C.sig}" stroke-width="1.5" opacity=".7"/></g>`;

  // measurements: two rows of four
  const my = bot + 70, cw = (S.w - 48) / 4;
  g += `<path d="M${S.x + 20} ${my - 30}H${S.x + S.w - 20}" stroke="#1D2220"/>`;
  st.cells.forEach(([k, v, sub, hl], i) => {
    const x = S.x + 28 + (i % 4) * cw, y = my + Math.floor(i / 4) * 96;
    g += text(x, y, k, { size: 15, ls: 1.3, fill: C.dim });
    g += text(x, y + 38, v, { size: Math.min(32, fit(v, cw - 30, 32, 'D')), font: 'D', fill: hl ? C.gold : C.silk });
    if (sub) g += text(x, y + 62, sub, { size: Math.min(14, fit(sub, cw - 26, 14, 'M', 1)), ls: 1, fill: C.gold });
    if (i % 4) g += `<path d="M${x - 16} ${y - 16}V${y + 66}" stroke="#1D2220"/>`;
  });

  const css = `.sweep{animation:sweep 8s linear infinite;animation-delay:-5s;transform:translateX(${r1((X1 - X0) * 0.62)}px)}@keyframes sweep{from{transform:translateX(0)}to{transform:translateX(${X1 - X0}px)}}@media (prefers-reduced-motion:reduce){.sweep{display:none}}`;
  const desc = `Logic analyzer capture of the last ${weeks.length} weeks of GitHub contributions. ${st.cells.map(c => `${c[0].toLowerCase()}: ${c[1]}${c[2] ? ' (' + c[2].toLowerCase() + ')' : ''}`).join('; ')}.`;
  return doc({ w: W, h: H, title: 'Live activity: logic analyzer capture', desc, css, body: g });
}
