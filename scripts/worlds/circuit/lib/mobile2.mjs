// Mobile variants for the bill of materials and the logic analyzer (600 wide, k = 2).
import { C, doc, text, fit, tw, board, busLines, pad, r1, BLOCK, blockTop, blockSides, blockBottom } from './svg.mjs';
import { pct, humanDate, stats } from './data.mjs';
import { shareOf, langColor, reel } from './toolbox.mjs';
import { smooth } from './activity.mjs';

const K = 2, W = 600, BL = BLOCK.L / K, BR = BLOCK.R / K, x0 = 60, x1 = 540;

export function bomM(profile, D, G = 0) {
  const cats = Object.entries(profile.toolbox || {}).filter(([, v]) => v?.length);
  const total = cats.reduce((s, [, v]) => s + v.length, 0), maxQty = Math.max(1, ...cats.map(([, v]) => v.length));
  let g = '', y = 84;
  cats.forEach(([cat, items], i) => {
    g += reel(x0 + 16, y - 7, 17, i, items.length, maxQty);
    g += text(x0 + 44, y, `F${i + 1} ${cat.toUpperCase()}`, { size: 20, ls: 2, fill: C.silk }) + text(x1, y, `QTY ${String(items.length).padStart(2, '0')}`, { size: 18, ls: 1.6, fill: C.gold, anchor: 'end' });
    y += 22;
    const lang = cat === 'languages';
    const parts = items.map(n => ({ n: n.toUpperCase(), s: lang ? shareOf(n, D.langShare) : 0, col: lang ? langColor(n, D.languages) : null }));
    if (lang) {
      parts.sort((a, b) => b.s - a.s);
      const sum = parts.reduce((a, p) => a + p.s, 0); let x = x0;
      if (sum > 0) parts.forEach(p => { if (!p.s) return; const w = (x1 - x0 - 4 * (parts.filter(q => q.s).length - 1)) * p.s / sum; g += `<rect x="${r1(x)}" y="${y}" width="${r1(Math.max(3, w))}" height="16" rx="2" fill="${p.col}" opacity=".7"/>`; x += w + 4; });
      y += sum > 0 ? 28 : 0;
    }
    let x = x0;
    parts.forEach(p => {
      const tag = lang ? (p.s > 0 ? pct(p.s) : '—') : '';
      const w = tw(p.n, 20, 'M', 1) + (tag ? tw(tag, 18, 'M', 0.5) + 14 : 0) + (lang ? 22 : 0) + 30;
      if (x + w > x1 && x > x0) { x = x0; y += 50; }
      g += `<rect x="${r1(x)}" y="${y}" width="${r1(w)}" height="40" rx="4" fill="#111513" stroke="#2A302C"/>` + pad(x + 4, y + 6, 5, 28, 1);
      let tx = x + 16;
      if (lang) { g += `<rect x="${r1(tx)}" y="${y + 14}" width="12" height="12" fill="${p.s > 0 ? p.col : 'none'}" stroke="${p.s > 0 ? 'none' : C.dim}"/>`; tx += 22; }
      g += text(tx, y + 27, p.n, { size: 20, ls: 1, fill: C.silk });
      if (tag) g += text(x + w - 10, y + 27, tag, { size: 18, ls: 0.5, fill: p.s > 0 ? C.gold : C.dim, anchor: 'end' });
      x += w + 10;
    });
    y += 96;
  });
  const H = y - 30;
  const body = board(W, H) + busLines(H, { G, k: K }) + blockSides(26, H - 14, [BL, BR], K) + blockBottom(H - 14, BL, BR, K) + blockTop(26, BL, BR, '03', 'BOM', `${total} ITEMS · ${cats.length} FEEDERS`, { k: K, size: 17 }) + g;
  const css = '.spin{transform-box:fill-box;transform-origin:center;animation:spin linear infinite}@keyframes spin{to{transform:rotate(360deg)}}';
  return doc({ w: W, h: H, k: K, title: 'Bill of materials: toolbox', desc: cats.map(([c, v]) => `${c}: ${v.join(', ')}`).join('. '), css, body });
}

export function scopeM(profile, D, G = 0) {
  const st = stats(D), weeks = D.weeks.length ? D.weeks : [{ total: 0 }];
  const max = Math.max(0, ...weeks.map(w => w.total));
  let g = "";
  g += `<circle cx="${x0 + 6}" cy="${88}" r="6" fill="${C.sig}" class="blink"/>` + text(x0 + 22, 95, 'LA-1 · LIVE CAPTURE', { size: 20, ls: 2, fill: C.silk });
  g += text(x0, 126, `SAMPLED ${humanDate(D.ref)} · ${weeks.length} WEEKS`, { size: 17, ls: 1.2, fill: C.gold });
  // A0 sparkline: contributions per week
  const A = { y: 176, h: 104 }, dx = (x1 - x0) / weeks.length;
  g += text(x0, A.y - 14, 'A0 · CONTRIBUTIONS PER WEEK', { size: 16, ls: 1.2, fill: C.dim });
  const pts = weeks.map((w, i) => [x0 + dx * (i + 0.5), A.y + A.h - (max ? w.total / max : 0) * A.h]);
  const d = smooth(pts, A.y, A.y + A.h);
  g += `<path d="M${x0} ${A.y + A.h}H${x1}" stroke="#1D2220"/><linearGradient id="ph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.sig}" stop-opacity=".3"/><stop offset="1" stop-color="${C.sig}" stop-opacity="0"/></linearGradient>`;
  if (pts.length > 1) g += `<path d="${d}L${r1(pts[pts.length - 1][0])} ${A.y + A.h}L${r1(pts[0][0])} ${A.y + A.h}Z" fill="url(#ph)"/>`;
  g += `<path d="${d}" fill="none" stroke="${C.sig}" stroke-width="2.4"/>`;
  if (D.peak?.count) {
    const i = weeks.findIndex(w => w.days?.some(dd => dd.date === D.peak.date));
    if (i >= 0) { const [px, py] = pts[i]; const lab = `PEAK ${st.n(D.peak.count)} · ${humanDate(D.peak.date)}`, lw = tw(lab, 16, 'M', 1); const lx = Math.min(x1 - lw, Math.max(x0, px - lw / 2)); g += `<circle cx="${r1(px)}" cy="${r1(py)}" r="5" fill="${C.gold}"/>` + text(lx, A.y + A.h + 30, lab, { size: 16, ls: 1, fill: C.gold }); }
  }
  // weekday bars
  const B = { y: 368, h: 76 }, bw = (x1 - x0) / 7, bmax = Math.max(1, ...st.byWd);
  g += text(x0, B.y - 14, 'CH0–CH6 · CONTRIBUTIONS BY WEEKDAY', { size: 16, ls: 1.2, fill: C.dim });
  ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach((dn, k) => {
    const v = st.byWd[k], h = Math.max(2, (v / bmax) * B.h), busy = st.busiest?.wd === k, x = x0 + k * bw;
    g += `<rect x="${r1(x + 8)}" y="${r1(B.y + B.h - h)}" width="${r1(bw - 16)}" height="${r1(h)}" rx="2" fill="${busy ? C.gold : C.sig}" opacity="${busy ? 0.9 : 0.55}"/>`;
    g += text(x + bw / 2, B.y + B.h + 26, dn, { size: 16, ls: 1, fill: busy ? C.gold : C.silk2, anchor: 'middle' });
  });
  // readouts, three rows of two
  const pick = [0, 1, 2, 3, 6, 7].map(i => st.cells[i]), cw = (x1 - x0) / 2, ry = 530;
  pick.forEach(([k, v, sub, hl], i) => {
    const x = x0 + (i % 2) * cw + (i % 2 ? 16 : 0), y = ry + Math.floor(i / 2) * 112;
    g += text(x, y, k, { size: Math.min(17, fit(k, cw - 20, 17, 'M', 1)), ls: 1, fill: C.dim });
    g += text(x, y + 46, v, { size: Math.min(42, fit(v, cw - 22, 42, 'D')), font: 'D', fill: hl ? C.gold : C.silk });
    if (sub) g += text(x, y + 74, sub, { size: Math.min(16, fit(sub, cw - 22, 16, 'M', 0.8)), ls: 0.8, fill: C.gold });
  });
  g += `<path d="M${x0 + cw + 2} ${ry - 18}V${ry + 3 * 112 - 30}" stroke="#1D2220"/>`;
  const H = ry + 3 * 112 + 4;
  const body = board(W, H) + busLines(H, { G, k: K }) + blockSides(26, H - 14, [BL, BR], K) + blockBottom(H - 14, BL, BR, K) + blockTop(26, BL, BR, '04', 'ANALYZER', 'LIVE', { k: K, size: 17 }) +
    `<rect x="${x0 - 14}" y="58" width="${x1 - x0 + 28}" height="${H - 88}" rx="8" fill="#060807" stroke="#232926"/>` + g;
  return doc({ w: W, h: H, k: K, title: 'Live activity: logic analyzer capture', desc: st.cells.map(c => `${c[0].toLowerCase()}: ${c[1]}`).join('; '), body });
}
