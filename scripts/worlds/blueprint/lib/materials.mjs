// SHEET 03: bill of materials (toolbox from profile.json) + material composition core sample (live languages).
import { C, W, T, L, R, P, Ci, DASH, r2, up, svgDoc, sheet, sheetHead, hatchDefs } from './svg.mjs';
import { wrap, langHatch } from './data.mjs';
import { link, img } from './readme.mjs';

const CAT = { languages: 'LANGUAGES', frameworks: 'FRAMEWORKS', data: 'DATA', infra: 'INFRASTRUCTURE', security: 'SECURITY' };

// wrap a list by whole items so a line never breaks inside "Windows Server"
function wrapItems(items, max) {
  const out = []; let line = '';
  for (const it of items) { const next = line ? `${line}  ·  ${it}` : it; if (line && next.length > max) { out.push(line); line = it; } else line = next; }
  if (line) out.push(line);
  return out;
}

function bom(x, y, w, toolbox) {
  const cols = [50, 178, w - 50 - 178 - 54, 54], heads = ['ITEM', 'PART', 'SPECIFICATION', 'QTY'];
  let s = '', cx = x;
  s += R(x, y, w, 28, { c: C.ink, w: W.med, fill: C.panel });
  heads.forEach((h, i) => { const mid = i === 0 || i === 3; s += T(mid ? cx + cols[i] / 2 : cx + 12, y + 19, h, { size: 10.5, fill: C.muted, ls: 1.4, anchor: mid ? 'middle' : null }); cx += cols[i]; });
  let ry = y + 28, total = 0;
  Object.entries(toolbox).forEach(([k, items], i) => {
    const lines = wrapItems(items, Math.floor((cols[2] - 22) / 7.9));
    const rh = Math.max(42, 20 + lines.length * 19);
    s += R(x, ry, w, rh, { c: C.line, w: W.thin });
    let xx = x;
    cols.forEach((c, j) => { if (j) s += L(xx, ry, xx, ry + rh, { c: C.line, w: W.thin }); xx += c; });
    s += T(x + cols[0] / 2, ry + rh / 2 + 5, String(i + 1).padStart(2, '0'), { size: 13, fill: C.ink, anchor: 'middle' });
    s += T(x + cols[0] + 12, ry + rh / 2 + 5, CAT[k] || up(k), { size: 12, font: 'disp', fill: C.ink, ls: 0.4 });
    const top = ry + (rh - lines.length * 19) / 2 + 14;
    lines.forEach((ln, j) => { s += T(x + cols[0] + cols[1] + 12, top + j * 19, ln, { size: 13, fill: C.line, ls: 0.2 }); });
    s += T(x + w - cols[3] / 2, ry + rh / 2 + 6, String(items.length), { size: 16, font: 'disp', fill: C.ink, anchor: 'middle' });
    total += items.length; ry += rh;
  });
  s += R(x, y, w, ry - y, { c: C.ink, w: W.thick });
  s += T(x + w - cols[3] - 12, ry + 24, 'TOTAL PARTS', { size: 11, fill: C.muted, anchor: 'end', ls: 1.4 }) + T(x + w - cols[3] / 2, ry + 26, String(total), { size: 18, font: 'disp', fill: C.ink, anchor: 'middle' });
  s += L(x + w - cols[3], ry + 34, x + w, ry + 34, { c: C.ink, w: W.med }) + L(x + w - cols[3], ry + 38, x + w, ry + 38, { c: C.ink, w: W.med });
  return { s, bottom: ry + 52 };
}

// Core sample: a drilled cylinder whose layers are his languages by bytes.
function core(x, y, h, data) {
  const hatch = langHatch(data), langs = data.languages || [];
  const big = langs.filter(l => l.share >= 0.02), small = langs.filter(l => l.share < 0.02);
  const layers = big.map(l => ({ name: up(l.name), share: l.share, repos: l.repos, id: hatch(l.name) }));
  if (small.length) layers.push({ name: `OTHER (${small.length})`, share: small.reduce((a, l) => a + l.share, 0), repos: null, id: 'hdots', other: small.map(l => up(l.name)) });
  const tot = layers.reduce((a, l) => a + l.share, 0) || 1, cw = 92, ey = 12;
  let s = '', yy = y;
  s += `<clipPath id="core"><path d="M${x} ${y}V${y + h}A${cw / 2} ${ey} 0 0 0 ${x + cw} ${y + h}V${y}Z"/></clipPath>`;
  let g = '';
  const mids = [];
  layers.forEach(l => {
    const lh = l.share / tot * h;
    const d = `M${x} ${r2(yy)}A${cw / 2} ${ey} 0 0 0 ${x + cw} ${r2(yy)}V${r2(yy + lh)}A${cw / 2} ${ey} 0 0 1 ${x} ${r2(yy + lh)}Z`;
    g += `<path d="${d}" fill="${C.sheet}"/><path d="${d}" fill="url(#${l.id})"/>`;
    g += `<path d="M${x} ${r2(yy)}A${cw / 2} ${ey} 0 0 0 ${x + cw} ${r2(yy)}" fill="none" stroke="${C.ink}" stroke-width="${W.thin}"/>`;
    mids.push(yy + lh / 2 + ey * 0.6); yy += lh;
  });
  s += `<g clip-path="url(#core)">${g}<rect class="scan" x="${x - 4}" y="${y}" width="${cw + 8}" height="2" fill="${C.red}" opacity=".8"/></g>`;
  s += `<ellipse cx="${x + cw / 2}" cy="${y}" rx="${cw / 2}" ry="${ey}" fill="${C.sheetHi}" stroke="${C.ink}" stroke-width="${W.thick}"/>`;
  s += Ci(x + cw / 2, y, 3, { c: C.ink, w: W.thin });
  s += P(`M${x} ${y}V${y + h}A${cw / 2} ${ey} 0 0 0 ${x + cw} ${y + h}V${y}`, { c: C.ink, w: W.thick });
  s += L(x + cw / 2, y - 26, x + cw / 2, y + h + ey + 18, { c: C.thin, w: W.hair, dash: DASH.center });
  // depth gauge 0..100%
  for (let i = 0; i <= 10; i++) { const ty = y + h * i / 10; s += L(x - (i % 5 ? 8 : 15), ty, x - 2, ty, { c: C.line, w: W.hair }); if (i % 5 === 0) s += T(x - 20, ty + 4, `${i * 10}`, { size: 10.5, fill: C.muted, anchor: 'end' }); }
  s += T(x - 20, y - 14, '% BYTES', { size: 10, fill: C.muted, anchor: 'end', ls: 1 });
  // fanned labels with leaders
  const lx = x + cw + 64, n = layers.length, step = Math.min(42, (h + 20) / Math.max(1, n));
  const ly0 = y + (h - step * (n - 1)) / 2;
  layers.forEach((l, i) => {
    const ty = ly0 + i * step, my = mids[i];
    s += L(x + cw + 4, my, x + cw + 34, my, { c: C.thin, w: W.hair }) + L(x + cw + 34, my, lx - 8, ty, { c: C.thin, w: W.hair }) + `<circle cx="${x + cw + 4}" cy="${r2(my)}" r="2.2" fill="${C.ink}"/>`;
    s += R(lx, ty - 10, 22, 22, { c: C.ink, w: W.thin, fill: C.sheet }) + `<rect x="${lx}" y="${r2(ty - 10)}" width="22" height="22" fill="url(#${l.id})"/>`;
    s += T(lx + 32, ty - 1, l.name, { size: 13, font: 'disp', fill: C.ink, ls: 0.4 });
    const pct = `${(l.share * 100).toFixed(1)}%`;
    s += T(lx + 32, ty + 13, l.repos != null ? `${pct}  ·  ${l.repos} REPO${l.repos === 1 ? '' : 'S'}` : `${pct}  ·  ${l.other.slice(0, 2).join(', ')}${l.other.length > 2 ? ` +${l.other.length - 2}` : ''}`, { size: 11, fill: C.muted, ls: 0.4 });
  });
  if (!layers.length) s += T(x + cw + 40, y + h / 2, 'NO PUBLIC CODE IN THIS SNAPSHOT', { size: 11, fill: C.muted, ls: 1 });
  return s;
}

export function build(profile, data, ctx, emit) {
  const w = 1200;
  // the parts list is laid out first: the sheet grows with profile.toolbox, never the other way round
  const t = bom(54, 124, 600, profile.toolbox), h = Math.max(500, Math.ceil((t.bottom + 44) / 10) * 10);
  const sh = sheet(w, h, { nx: 8, ny: 3 }), ch = 286, cy = Math.round(134 + (h - 500) / 2);
  let b = sh.body;
  b += sheetHead(54, 50, '03', 'BILL OF MATERIALS', 'TOOLBOX AS SPECIFIED BY THE ENGINEER');
  b += t.s;
  b += L(690, 64, 690, h - 50, { c: C.faint, w: W.hair, dash: '2 5' });
  b += T(724, 74, 'MATERIAL COMPOSITION', { size: 15, font: 'disp', fill: C.ink, ls: 1 }) + T(724, 94, `CORE SAMPLE, ALL PUBLIC REPOSITORIES, BY BYTES  ·  ${data.generatedAt.slice(0, 10)}`, { size: 10.5, fill: C.muted, ls: 0.8 });
  b += core(774, cy, ch, data);
  b += T(724, h - 48, 'HATCH KEY FOLLOWS ANSI MATERIAL SYMBOLS', { size: 10.5, fill: C.muted, ls: 1.2 });
  const css = `@keyframes scan{0%{transform:translateY(0)}50%{transform:translateY(${ch + 10}px)}100%{transform:translateY(0)}}.scan{animation:scan 7s cubic-bezier(.45,0,.55,1) infinite}`;
  emit('bom.svg', svgDoc({
    w, h, title: 'Bill of materials: toolbox and language composition',
    desc: `Toolbox: ${Object.entries(profile.toolbox).map(([k, v]) => `${k}: ${v.join(', ')}`).join('; ')}. Languages by bytes: ${(data.languages || []).slice(0, 6).map(l => `${l.name} ${(l.share * 100).toFixed(1)}%`).join(', ')}.`,
    fonts: ['disp', 'mono'], css, defs: sh.defs + hatchDefs(C.line, 0.75), body: b,
  }));
  ctx.md ??= [];
  ctx.md.push(`<p align="center">${link(`${profile.links.github}?tab=repositories`, img('bom.svg', `Bill of materials. Toolbox: ${Object.values(profile.toolbox).flat().join(', ')}.`))}</p>`);
}
