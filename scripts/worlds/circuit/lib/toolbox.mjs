// Toolbox as a bill of materials: each category is a feeder reel (wound tape ~ QTY); its tools ride
// the carrier tape. The language tape is a proportional bar: each pocket is as long as that
// language's live share of his public code (bytes, data.json), called out to a legend below.
import { C, doc, text, fit, tw, board, busLines, pad, r1, BLOCK, blockTop, blockSides, blockBottom } from './svg.mjs';
import { pct } from './data.mjs';

export const shareOf = (name, ls) => name.split('/').map(s => s.trim().toLowerCase()).reduce((s, p) => s + (ls[p] || 0), 0);
export const langColor = (name, langs) => (langs.find(l => name.toLowerCase().split('/').map(s => s.trim()).includes(l.name.toLowerCase())) || {}).color || C.dim;

export function reel(cx, cy, r, i, qty, maxQty) {
  const t = 0.42 + 0.48 * Math.min(1, qty / Math.max(1, maxQty)); // wound tape reaches further out with more parts
  const hub = r * 0.34, out = r * t, mid = (hub + out) / 2;
  const spokes = [0, 120, 240].map(a => `<path d="M0 -${r1(hub)}A${r1(hub)} ${r1(hub)} 0 0 1 ${r1(hub * Math.sin(1.0))} ${r1(-hub * Math.cos(1.0))}L0 0Z" transform="rotate(${a})" fill="#5A605B"/>`).join('');
  return `<g transform="translate(${cx} ${cy})">
<circle r="${r}" fill="#141816" stroke="${C.pkgEdge}" stroke-width="1.5"/><circle r="${r * 0.93}" fill="none" stroke="#262B28" stroke-width="1"/>
<circle r="${r1(mid)}" fill="none" stroke="#6E5424" stroke-width="${r1(out - hub)}"/>
<g class="spin" style="animation-duration:${16 + i * 3}s"><circle r="${r1(mid)}" fill="none" stroke="#A88242" stroke-width="${r1(out - hub - 2)}" stroke-dasharray="2 7" opacity=".55"/>${spokes}<circle r="${r1(hub)}" fill="none" stroke="#6A706B" stroke-width="2"/></g>
<circle r="${r1(r * 0.12)}" fill="url(#au)"/></g>`;
}

export function toolbox(profile, D, { G = 0 } = {}) {
  const W = 1200, tx0 = 216, tx1 = 1096, th = 44, pitch = 96, legendH = 84;
  const cats = Object.entries(profile.toolbox || {}).filter(([, v]) => v?.length);
  const maxQty = Math.max(1, ...cats.map(([, v]) => v.length));
  const total = cats.reduce((s, [, v]) => s + v.length, 0);
  const isLang = c => c === 'languages';
  let y = 104; const rowsY = cats.map(([c]) => { const y0 = y; y += pitch + (isLang(c) ? legendH : 0); return y0; });
  const H = y + 30;
  let g = board(W, H) + busLines(H, { G }) + blockSides(34, H - 18) + blockBottom(H - 18, BLOCK.L, BLOCK.R);
  g += blockTop(34, BLOCK.L, BLOCK.R, '03', 'BILL OF MATERIALS', `${total} ITEMS ON ${cats.length} FEEDERS`);
  g += text(tx1, 76, 'LANGUAGE TAPE = SHARE OF PUBLIC CODE, LIVE', { size: 15, ls: 1.4, fill: C.dim, anchor: 'end' });
  const stops = [];
  cats.forEach(([cat, items], i) => {
    const y0 = rowsY[i], ty = y0 + 30;
    g += reel(150, ty + th / 2, 40, i, items.length, maxQty);
    g += text(tx0, y0 + 16, `F${i + 1}`, { size: 18, ls: 2, fill: C.gold }) + text(tx0 + 50, y0 + 16, cat.toUpperCase(), { size: 18, ls: 2.4, fill: C.silk });
    g += text(tx1, y0 + 16, `QTY ${String(items.length).padStart(2, '0')}`, { size: 16, ls: 2, fill: C.gold, anchor: 'end' });
    g += `<rect x="${tx0 - 66}" y="${ty}" width="${tx1 - tx0 + 66}" height="${th}" fill="#151917" stroke="#222825"/><rect x="${tx0 - 66}" y="${ty}" width="${tx1 - tx0 + 66}" height="8" fill="#1B201D"/>`;
    for (let x = tx0 - 4; x < tx1 - 4; x += 16) g += `<circle cx="${x}" cy="${ty + 4}" r="2.2" fill="#050606"/>`;
    const py = ty + 11, ph = th - 15;
    if (isLang(cat)) {
      // proportional pockets, biggest share first; zero-share languages get no pocket, only a legend dash
      const parts = items.map(n => ({ n, s: shareOf(n, D.langShare), col: langColor(n, D.languages) })).sort((a, b) => b.s - a.s);
      const sum = parts.reduce((a, p) => a + p.s, 0) || 1, live = parts.filter(p => p.s > 0), gap = 6;
      const span = tx1 - tx0 - gap * Math.max(0, live.length - 1);
      let x = tx0; const cw = (tx1 - tx0) / parts.length, ly = ty + th + 54;
      parts.forEach((p, j) => {
        const lx = tx0 + cw * j + 4;
        if (p.s > 0) {
          const w = Math.max(6, span * p.s / sum);
          g += `<rect x="${r1(x)}" y="${py}" width="${r1(w)}" height="${ph}" rx="2" fill="#0B0D0C" stroke="#2A302C"/>`;
          g += `<rect x="${r1(x + 3)}" y="${py + 4}" width="${r1(Math.max(1, w - 6))}" height="${ph - 8}" rx="1.5" fill="${p.col}" opacity=".55"/>`;
          if (w > 70) g += text(x + w / 2, py + ph / 2 + 6, pct(p.s), { size: 16, ls: 1, anchor: 'middle', fill: C.silk });
          const sx = x + w / 2;
          g += `<path d="M${r1(sx)} ${ty + th}V${ty + th + 8}L${r1(lx + 5)} ${ly - 30}V${ly - 22}" fill="none" stroke="${C.silk2}" stroke-width="1.2" opacity=".55"/><circle cx="${r1(sx)}" cy="${ty + th + 2}" r="2.4" fill="${C.silk2}"/>`;
          if (j === 0) stops.push([x, py, w, ph]);
          x += w + gap;
        }
        g += `<rect x="${r1(lx)}" y="${ly - 14}" width="10" height="10" fill="${p.s > 0 ? p.col : 'none'}" stroke="${p.s > 0 ? 'none' : C.dim}"/>`;
        const nm = p.n.toUpperCase(); const ns = Math.min(18, fit(nm, cw - 30, 18, 'M', 1));
        g += text(lx + 18, ly - 4, nm, { size: ns, ls: 1, fill: p.s > 0 ? C.silk : C.dim });
        g += text(lx + 18, ly + 22, p.s > 0 ? pct(p.s) : '—', { size: 18, ls: 1, fill: p.s > 0 ? C.gold : C.dim });
      });
    } else {
      let fs = 19; const need = z => items.reduce((s, it) => s + tw(it.toUpperCase(), z, 'M', 1) + 44 + 10, 0);
      while (fs > 15 && need(fs) > tx1 - tx0) fs -= 1;
      let x = tx0;
      items.forEach((it, j) => {
        const nm = it.toUpperCase(), w = tw(nm, fs, 'M', 1) + 44;
        g += `<rect x="${r1(x)}" y="${py}" width="${r1(w)}" height="${ph}" rx="3" fill="#0B0D0C" stroke="#2A302C"/>`;
        g += pad(x + 5, py + 5, 7, ph - 10, 1) + pad(x + w - 12, py + 5, 7, ph - 10, 1) + `<rect x="${r1(x + 12)}" y="${py + 5}" width="${r1(w - 24)}" height="${ph - 10}" fill="#1D211F"/>`;
        g += text(x + w / 2, py + ph / 2 + fs * 0.36, nm, { size: fs, ls: 1, fill: C.silk, anchor: 'middle' });
        if (j === 0) stops.push([x, py, w, ph]);
        x += w + 10;
      });
      [0.5, 0.3, 0.14].forEach(op => { if (x + 40 < tx1) { g += `<rect x="${r1(x)}" y="${py}" width="40" height="${ph}" rx="3" fill="#0B0D0C" stroke="#2A302C" opacity="${op}"/>`; x += 50; } });
    }
  });

  // Pick-and-place vision reticle: four corner brackets hop to the first part of each feeder,
  // resizing to the pocket (data-driven keyframes, one set per corner).
  let css = '.spin{transform-box:fill-box;transform-origin:center;animation:spin linear infinite}@keyframes spin{to{transform:rotate(360deg)}}';
  if (stops.length) {
    const n = stops.length, seg = 100 / n, T = n * 2.2;
    const corner = [[0, 0, 'M0 12V0H12'], [1, 0, 'M-12 0H0V12'], [1, 1, 'M0 -12V0H-12'], [0, 1, 'M12 0H0V-12']];
    corner.forEach(([cx, cy, d], k) => {
      const pos = ([x, y, w, h]) => `translate(${r1(x - 5 + cx * (w + 10))}px,${r1(y - 5 + cy * (h + 10))}px)`;
      let kf = '';
      stops.forEach((s, i) => (kf += `${r1(i * seg)}%,${r1(i * seg + seg * 0.72)}%{transform:${pos(s)}}`));
      kf += `100%{transform:${pos(stops[0])}}`;
      css += `@keyframes pk${k}{${kf}}.pk${k}{animation:pk${k} ${r1(T)}s cubic-bezier(.6,0,.2,1) infinite}`;
      g += `<path class="pk${k}" d="${d}" fill="none" stroke="${C.sig}" stroke-width="2.4" style="transform:${pos(stops[0])}"/>`;
    });
  }
  const desc = cats.map(([c, v]) => `${c}: ${v.map(it => (isLang(c) && shareOf(it, D.langShare) > 0 ? `${it} (${pct(shareOf(it, D.langShare))} of public code)` : it)).join(', ')}`).join('. ');
  return doc({ w: W, h: H, title: 'Bill of materials: toolbox', desc, css, body: g });
}
