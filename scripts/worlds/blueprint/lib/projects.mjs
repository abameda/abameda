// SHEET 02: principal assemblies. One linked drawing sheet per featured project,
// in a landscape desktop layout and a portrait phone layout (served via <picture> media).
import { C, W, T, L, R, up, r2, svgDoc, sheet, hatchDefs, arrow } from './svg.mjs';
import { ymd, ago, repoFor, repoLangs, langHatch, fitSize, dispWidth, fitLines, host, monoWidth } from './data.mjs';
import { cell } from './parts.mjs';
import { cortex, dose } from './drawings-a.mjs';
import { attendance, bosla } from './drawings-b.mjs';
import { link, img } from './readme.mjs';

export const FEATURED = ['cortex', 'dose', 'attendance', 'bosla'];
const DRAW = { cortex, dose, attendance, bosla };

// Type scales. Desktop sheets show at ~0.71 of their units, phone sheets at ~0.5.
const DESK = { tagW: 74, tagH: 44, tagN: 19, tagL: 8.5, title: 13, kind: 12, name: 52, nameY: 106, desc: [19, 17.5, 16], lines: 4, rh: 32, val: 15, lab: 11, lw: 128, bar: 120, open: 15 };
const MOB = { tagW: 96, tagH: 58, tagN: 26, tagL: 11, title: 19, kind: 17, name: 84, nameY: 150, desc: [30, 28, 26, 24], lines: 6, rh: 48, val: 23, lab: 16, lw: 196, bar: 160, open: 23 };

// Sheet tag, assembly letter, kind, name, rule, description. Returns { s, bottom }.
function head(p, x, y0, w, K, no, letter) {
  let s = R(x, y0, K.tagW, K.tagH, { c: C.ink, w: W.med }) + T(x + K.tagW / 2, y0 + K.tagL + 5, 'SHEET', { size: K.tagL, fill: C.muted, anchor: 'middle', ls: 2 }) +
    T(x + K.tagW / 2, y0 + K.tagH - 8, no, { size: K.tagN, font: 'disp', fill: C.ink, anchor: 'middle' });
  const tx = x + K.tagW + 16, room = w - K.tagW - 16, kind = up(p.kind);
  s += T(tx, y0 + K.title + 4, `PRINCIPAL ASSEMBLY ${letter}`, { size: K.title, font: 'disp', fill: C.ink, ls: 1.5 });
  s += T(tx, y0 + K.tagH - 6, kind, { size: K.kind, fill: C.muted, ls: 1.2, tl: monoWidth(kind, K.kind, 1.2) > room ? room : null });
  const name = up(p.name), size = fitSize(name, K.name, w);
  s += T(x - 2, y0 + K.nameY, name, { size: r2(size), font: 'disp', fill: C.ink, tl: dispWidth(name, size) > w ? w : null });
  const ry = y0 + K.nameY + K.name * 0.3;
  s += L(x, ry, x + w, ry, { c: C.ink, w: W.thick });
  const d = fitLines(p.line, w, K.desc, K.lines, 0.2, 2), dy = ry + 12 + d.size;
  d.lines.forEach((ln, i) => { s += T(x, dy + i * d.lh, ln, { size: d.size, fill: C.ink, ls: 0.2 }); });
  return { s, bottom: dy + (d.lines.length - 1) * d.lh + d.size * 0.4 };
}

// Spec table: STACK, REPOSITORY, LAST REVISION, MATERIAL (live). Returns { s, h }.
function table(p, x, y, w, data, K, login) {
  const repo = repoFor(data, p.repo), hatch = langHatch(data), rh = K.rh, lw = K.lw, vw = w - lw - 20;
  const rows = [
    ['STACK', p.stack.map(up).join(' · ')],
    ['REPOSITORY', `${login}/${repo ? repo.name : p.repo}`],
    ['LAST REVISION', repo ? `${ymd(repo.pushedAt)} · ${ago(repo.pushedAt, data.generatedAt)}` : 'NOT PUBLIC'],
  ];
  let s = '';
  rows.forEach(([k, v], i) => {
    const ry = y + i * rh, by = ry + rh / 2 + K.val * 0.36;
    s += cell(x, ry, lw, rh, '', null) + T(x + 10, ry + rh / 2 + K.lab * 0.36, k, { size: K.lab, fill: C.muted, ls: 1.2 });
    s += R(x + lw, ry, w - lw, rh, { c: C.line, w: W.thin }) + T(x + lw + 12, by, v, { size: K.val, fill: C.ink, ls: 0.4, tl: monoWidth(v, K.val, 0.4) > vw ? vw : null });
  });
  const my = y + rows.length * rh, mh = rh + 6, langs = repoLangs(repo);
  s += cell(x, my, lw, mh, '', null) + T(x + 10, my + mh / 2 + K.lab * 0.36, 'MATERIAL', { size: K.lab, fill: C.muted, ls: 1.2 });
  s += R(x + lw, my, w - lw, mh, { c: C.line, w: W.thin });
  if (langs.length) {
    const bx = x + lw + 12, bh = mh * 0.46, by = my + (mh - bh) / 2; let cx = bx;
    langs.forEach(l => {
      const lw2 = Math.max(2, l.share * K.bar);
      s += `<rect x="${r2(cx)}" y="${r2(by)}" width="${r2(lw2)}" height="${r2(bh)}" fill="url(#${l.name === 'OTHER' ? 'hdots' : hatch(l.name)})" stroke="${C.ink}" stroke-width="${W.thin}"/>`;
      cx += lw2;
    });
    const size = K.val * 0.87, room = w - lw - K.bar - 40;
    const named = langs.filter(l => l.name !== 'OTHER').map(l => `${up(l.name)} ${Math.round(l.share * 100)}%`);
    let top = named[0] || '';
    if (named[1] && monoWidth(`${top} · ${named[1]}`, size) <= room) top += ` · ${named[1]}`;
    s += T(bx + K.bar + 14, my + mh / 2 + size * 0.36, top, { size: r2(size), fill: C.line, tl: monoWidth(top, size) > room ? room : null });
  } else s += T(x + lw + 12, my + mh / 2 + K.val * 0.3, 'PRIVATE / NOT PUBLISHED', { size: K.val * 0.8, fill: C.muted });
  return { s, h: rows.length * rh + mh };
}

function openLine(p, x, y, w, K) {
  return T(x, y, `OPEN  ${host(p.url)}`, { size: K.open, fill: C.ink, ls: 1, tl: monoWidth(`OPEN  ${host(p.url)}`, K.open, 1) > w - 60 ? w - 60 : null }) +
    L(x + w - 40, y - K.open * 0.3, x + w - 6, y - K.open * 0.3, { c: C.red, w: W.med }) + arrow(x + w - 40, y - K.open * 0.3, x + w, y - K.open * 0.3, { c: C.red, s: 11, wd: 4.5 });
}

const doc = (p, w, h, d, sh, b) => svgDoc({
  w, h, title: `${p.name}: ${p.kind}`, desc: `${p.line} Stack: ${p.stack.join(', ')}.`,
  fonts: ['disp', 'mono', 'hand'], css: d.css || '', defs: sh.defs + hatchDefs(C.line, 0.7) + (d.defs || ''), body: b,
});

// Landscape sheet: drawing on one side, spec column on the other (mirrored each sheet).
function desktopSheet(p, i, profile, data, h) {
  const w = 1200, left = i % 2 === 0, no = `02.${i + 1}`, letter = String.fromCharCode(65 + i);
  const sh = sheet(w, h, { nx: 8, ny: 3 });
  const box = { x: left ? 44 : 536, y: Math.round((h - 392) / 2), w: 620, h: 392 };
  const sx = left ? 700 : 62, sw = 440, d = (DRAW[p.key] || DRAW.cortex)(box, { ...p, redline: profile.redlines?.[p.key] }, data);
  const hd = head(p, sx, 52, sw, DESK, no, letter), tb = table(p, sx, 0, sw, data, DESK, profile.login);
  const oy = h - 52, ty = oy - 30 - tb.h;
  let b = sh.body + L(left ? 680 : 520, 44, left ? 680 : 520, h - 44, { c: C.faint, w: W.hair, dash: '2 5' });
  b += d.svg + hd.s + `<g transform="translate(0 ${r2(ty)})">${tb.s}</g>` + openLine(p, sx, oy, sw, DESK);
  return doc(p, w, h, d, sh, b);
}
const deskNeed = (p, data, login) => head(p, 0, 52, 440, DESK, '', '').bottom + 22 + table(p, 0, 0, 440, data, DESK, login).h + 30 + 52;

// Portrait phone sheet: title and description first, then the drawing, then the spec table.
function mobileSheet(p, i, profile, data) {
  const w = 700, x = 46, cw = 608, no = `02.${i + 1}`, letter = String.fromCharCode(65 + i);
  const hd = head(p, x, 50, cw, MOB, no, letter);
  const box = { x: 40, y: Math.round(hd.bottom + 18), w: 620, h: 392 };
  const tb = table(p, x, box.y + box.h + 22, cw, data, MOB, profile.login);
  const oy = box.y + box.h + 22 + tb.h + 52, h = Math.round(oy + 52);
  const sh = sheet(w, h, { nx: 4, ny: Math.max(3, Math.round(h / 220)) });
  const d = (DRAW[p.key] || DRAW.cortex)(box, { ...p, redline: profile.redlines?.[p.key] }, data);
  const b = sh.body + hd.s + L(46, box.y - 6, 654, box.y - 6, { c: C.faint, w: W.hair, dash: '2 5' }) + d.svg + tb.s + openLine(p, x, oy, cw, MOB);
  return doc(p, w, h, d, sh, b);
}

export function build(profile, data, ctx, emit) {
  const feat = FEATURED.map(k => profile.projects.find(p => p.key === k)).filter(Boolean);
  // every principal-assembly sheet shares one height: the tallest spec column decides it
  const h = Math.max(480, Math.ceil(Math.max(...feat.map(p => deskNeed(p, data, profile.login))) / 10) * 10);
  ctx.md ??= [];
  feat.forEach((p, i) => {
    emit(`p-${p.key}.svg`, desktopSheet(p, i, profile, data, h));
    emit(`p-${p.key}-m.svg`, mobileSheet(p, i, profile, data));
    const alt = `${p.name}: ${p.kind}. ${p.line}`;
    ctx.md.push(`<p align="center">${link(p.url, `<picture><source media="(max-width: 600px)" srcset="assets/p-${p.key}-m.svg">${img(`p-${p.key}.svg`, alt)}</picture>`)}</p>`);
  });
  ctx.featured = feat.map(p => p.key);
}
