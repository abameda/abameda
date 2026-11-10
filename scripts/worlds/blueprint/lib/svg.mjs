// Shared drawing kit: palette, line weights, fonts, sheet frame, dimension lines, balloons, hatches.
import { readFileSync } from 'node:fs';

const FONT_DIR = new URL('../fonts/', import.meta.url);

// Cyanotype palette: Prussian blue paper, white line work, one redline accent.
export const C = {
  sheet: '#0c3767', sheetHi: '#164c86', sheetLo: '#082a50',
  ink: '#f3f8ff',
  line: '#d6e6f8',
  thin: 'rgba(214,230,250,.66)',
  faint: 'rgba(214,230,250,.34)',
  ghost: 'rgba(214,230,250,.16)',
  muted: '#a6c4e6',
  red: '#ff5d4a',
  redSoft: 'rgba(255,93,74,.55)',
  grid1: 'rgba(255,255,255,.05)', grid2: 'rgba(255,255,255,.095)',
  panel: 'rgba(8,42,80,.6)', wash: 'rgba(255,255,255,.045)', graph: 'rgba(255,255,255,.07)',
};

// Whiteprint (diazo) palette: the same drawing set run off as blue line work on pale vellum.
export const WHITEPRINT = {
  sheet: '#e6eef6', sheetHi: '#f4f8fc', sheetLo: '#d5e1ed',
  ink: '#0a3463', line: '#14457a',
  thin: 'rgba(20,69,122,.72)', faint: 'rgba(20,69,122,.4)', ghost: 'rgba(20,69,122,.18)',
  muted: '#48698f', red: '#d6402f', redSoft: 'rgba(214,64,47,.55)',
  grid1: 'rgba(10,52,99,.06)', grid2: 'rgba(10,52,99,.12)',
  panel: 'rgba(10,52,99,.08)', wash: 'rgba(10,52,99,.055)', graph: 'rgba(10,52,99,.08)',
};
// Render with another palette (everything reads C at call time).
export function withPalette(pal, fn) {
  const saved = { ...C };
  Object.assign(C, pal);
  try { return fn(); } finally { Object.assign(C, saved); }
}

// ISO 128 inspired weights (in 1200-wide viewBox units).
export const W = { thick: 2.6, med: 1.6, thin: 1, hair: 0.7 };

export const FONT = {
  disp: "'BPDisplay','Arial Black','Segoe UI',sans-serif",
  mono: "'BPMono',ui-monospace,Consolas,'DejaVu Sans Mono',monospace",
  hand: "'BPHand','Comic Sans MS','Segoe Print',cursive",
};
const FONT_FILES = { disp: ['BPDisplay', 'archivo-x800.woff2'], mono: ['BPMono', 'plexmono-500.woff2'], hand: ['BPHand', 'kalam-400.woff2'] };
const fontCache = {};
export function fontFace(keys) {
  return keys.map(k => {
    const [fam, file] = FONT_FILES[k];
    fontCache[file] ??= readFileSync(new URL(file, FONT_DIR)).toString('base64');
    return `@font-face{font-family:'${fam}';src:url(data:font/woff2;base64,${fontCache[file]}) format('woff2');font-display:swap}`;
  }).join('');
}

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const r2 = n => Math.round(n * 100) / 100;
export const up = s => String(s).toUpperCase();

// Text. o: size, font (disp|mono|hand), fill, anchor, ls (letter-spacing), cls, rot, op, tl (textLength)
export function T(x, y, str, o = {}) {
  const a = [`x="${r2(x)}"`, `y="${r2(y)}"`, `font-family="${FONT[o.font || 'mono']}"`, `font-size="${o.size || 13}"`, `fill="${o.fill || C.line}"`];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.ls) a.push(`letter-spacing="${o.ls}"`);
  if (o.cls) a.push(`class="${o.cls}"`);
  if (o.op != null) a.push(`opacity="${o.op}"`);
  if (o.tl) a.push(`textLength="${r2(o.tl)}" lengthAdjust="${o.adj || 'spacingAndGlyphs'}"`);
  if (o.rot) a.push(`transform="rotate(${o.rot} ${r2(x)} ${r2(y)})"`);
  if (o.stroke) a.push(`stroke="${o.stroke}" stroke-width="${o.sw || 1}"`);
  if (o.extra) a.push(o.extra);
  let body = esc(str);
  if ((o.font || 'mono') === 'mono' && /[ÄÖÜ]/.test(body)) body = body.replace(/([^\s,.;:()]*[ÄÖÜ][^\s,.;:()]*)/g, `<tspan font-family="${FONT.disp}" font-size="${r2((o.size || 13) * 0.84)}" letter-spacing="0.5">$1</tspan>`);
  return `<text ${a.join(' ')}>${body}</text>`;
}

export const L = (x1, y1, x2, y2, o = {}) =>
  `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" stroke="${o.c || C.line}" stroke-width="${o.w || W.thin}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.cls ? ` class="${o.cls}"` : ''}${o.cap ? ` stroke-linecap="${o.cap}"` : ''}/>`;

export const P = (d, o = {}) =>
  `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.c || C.line}" stroke-width="${o.w ?? W.thin}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.cls ? ` class="${o.cls}"` : ''} stroke-linejoin="round" stroke-linecap="round"${o.extra ? ' ' + o.extra : ''}/>`;

export const R = (x, y, w, h, o = {}) =>
  `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="${o.fill || 'none'}" stroke="${o.c || 'none'}" stroke-width="${o.w || W.thin}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.rx ? ` rx="${o.rx}"` : ''}${o.cls ? ` class="${o.cls}"` : ''}/>`;

export const Ci = (cx, cy, r, o = {}) =>
  `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${o.fill || 'none'}" stroke="${o.c || C.line}" stroke-width="${o.w || W.thin}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.cls ? ` class="${o.cls}"` : ''}/>`;

// Drafting dash patterns
export const DASH = { hidden: '7 4', center: '24 5 4 5', phantom: '22 4 4 4 4 4' };

// Filled arrowhead pointing from (x2,y2) toward (x1,y1)->(x2,y2) direction.
export function arrow(x1, y1, x2, y2, o = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1), s = o.s || 9, wd = o.wd || 2.6;
  const bx = x2 - Math.cos(a) * s, by = y2 - Math.sin(a) * s;
  const nx = -Math.sin(a) * wd, ny = Math.cos(a) * wd;
  return `<path d="M${r2(x2)} ${r2(y2)}L${r2(bx + nx)} ${r2(by + ny)}L${r2(bx - nx)} ${r2(by - ny)}Z" fill="${o.c || C.line}"/>`;
}

// Horizontal dimension: extension lines from y0 down/up to y, arrows, label above the line (ISO style).
export function dimH(x1, x2, y, label, o = {}) {
  const c = o.c || C.thin, y0 = o.y0 ?? y;
  let s = '';
  if (o.ext !== false) { const d = y0 > y ? 1 : -1; s += L(x1, y0 - d * 4, x1, y - d * 6, { c, w: W.hair }) + L(x2, y0 - d * 4, x2, y - d * 6, { c, w: W.hair }); }
  s += L(x1, y, x2, y, { c, w: W.hair }) + arrow(x2, y, x1, y, { c }) + arrow(x1, y, x2, y, { c });
  if (label) s += T((x1 + x2) / 2 + (o.dx || 0), y - 6, label, { size: o.size || 12, fill: o.tc || C.line, anchor: 'middle', ls: o.ls ?? 1.5 });
  return s;
}

export function dimV(x, y1, y2, label, o = {}) {
  const c = o.c || C.thin, x0 = o.x0 ?? x;
  let s = '';
  if (o.ext !== false) { const d = x0 > x ? 1 : -1; s += L(x0 - d * 4, y1, x - d * 6, y1, { c, w: W.hair }) + L(x0 - d * 4, y2, x - d * 6, y2, { c, w: W.hair }); }
  s += L(x, y1, x, y2, { c, w: W.hair }) + arrow(x, y2, x, y1, { c }) + arrow(x, y1, x, y2, { c });
  if (label) s += T(x - 7, (y1 + y2) / 2, label, { size: o.size || 12, fill: o.tc || C.line, anchor: 'middle', ls: o.ls ?? 1.5, rot: -90 });
  return s;
}

// Item balloon with leader: circle at (bx,by), leader to (px,py) ending in a dot.
export function balloon(bx, by, n, px, py, o = {}) {
  const r = o.r || 13, a = Math.atan2(py - by, px - bx);
  const sx = bx + Math.cos(a) * r, sy = by + Math.sin(a) * r;
  return L(sx, sy, px, py, { c: o.c || C.thin, w: W.hair }) + `<circle cx="${r2(px)}" cy="${r2(py)}" r="2.4" fill="${o.c || C.line}"/>` +
    Ci(bx, by, r, { c: o.c || C.ink, w: W.med }) + T(bx, by + 4.5, n, { size: o.size || 13, fill: o.c || C.ink, anchor: 'middle' });
}

// Hatch patterns: drafting material symbols (ANSI31, ANSI32, ANSI37, dots, etc.)
export function hatchDefs(c = C.line, op = 0.75) {
  const pat = (id, sz, rot, body) => `<pattern id="${id}" width="${sz}" height="${sz}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})">${body}</pattern>`;
  const ln = (y, w = 0.9) => `<line x1="0" y1="${y}" x2="40" y2="${y}" stroke="${c}" stroke-width="${w}" opacity="${op}"/>`;
  return [
    pat('h31', 7, 45, ln(0.5)),
    pat('h32', 12, 45, ln(0.5) + ln(3.5)),
    pat('h37', 8, 45, ln(0.5) + `<line x1="0.5" y1="0" x2="0.5" y2="40" stroke="${c}" stroke-width="0.9" opacity="${op}"/>`),
    pat('hneg', 7, -45, ln(0.5)),
    pat('hdots', 9, 15, `<circle cx="2" cy="2" r="1.05" fill="${c}" opacity="${op}"/><circle cx="6.5" cy="6.5" r="0.7" fill="${c}" opacity="${op}"/>`),
    pat('hbrick', 14, 0, ln(0.5) + ln(7.5) + `<line x1="0.5" y1="0" x2="0.5" y2="7" stroke="${c}" stroke-width="0.9" opacity="${op}"/><line x1="7.5" y1="7" x2="7.5" y2="14" stroke="${c}" stroke-width="0.9" opacity="${op}"/>`),
    pat('hzig', 10, 0, `<path d="M0 5L2.5 1.5L5 5L7.5 1.5L10 5" fill="none" stroke="${c}" stroke-width="0.9" opacity="${op}"/>`),
    pat('hwide', 14, 45, ln(0.5, 1.4)),
  ].join('');
}
export const HATCHES = ['h31', 'h37', 'h32', 'hbrick', 'hzig', 'hneg', 'hwide', 'hdots'];

// Paper + grid + double border + zone markers. Returns { defs, body }.
export function sheet(w, h, o = {}) {
  const m = o.margin ?? 14, z = o.zone ?? 16;
  const defs = `<radialGradient id="paper" cx="38%" cy="30%" r="85%"><stop offset="0" stop-color="${C.sheetHi}"/><stop offset=".55" stop-color="${C.sheet}"/><stop offset="1" stop-color="${C.sheetLo}"/></radialGradient>` +
    `<pattern id="g1" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="${C.grid1}" stroke-width="1"/></pattern>` +
    `<pattern id="g2" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="url(#g1)"/><path d="M100 0H0V100" fill="none" stroke="${C.grid2}" stroke-width="1"/></pattern>`;
  let b = `<rect width="${w}" height="${h}" fill="url(#paper)"/>`;
  if (o.edge) b += R(0.75, 0.75, w - 1.5, h - 1.5, { c: C.faint, w: 1.5 });
  if (o.grid !== false) b += `<rect x="${m}" y="${m}" width="${w - 2 * m}" height="${h - 2 * m}" fill="url(#g2)"/>`;
  b += R(m, m, w - 2 * m, h - 2 * m, { c: C.faint, w: W.thin });
  if (o.zones !== false) {
    const ix = m + z, iy = m + z, iw = w - 2 * ix, ih = h - 2 * iy;
    b += R(ix, iy, iw, ih, { c: C.ink, w: W.thick });
    const nx = o.nx || Math.max(2, Math.round(iw / 150)), ny = o.ny || Math.max(1, Math.round(ih / 140));
    for (let i = 0; i <= nx; i++) {
      const x = ix + iw * i / nx;
      if (i > 0 && i < nx) b += L(x, m, x, iy, { c: C.faint, w: W.hair }) + L(x, h - m, x, h - iy, { c: C.faint, w: W.hair });
      if (i < nx) { const cx = ix + iw * (i + .5) / nx; b += T(cx, m + z / 2 + 4, i + 1, { size: 10, fill: C.muted, anchor: 'middle' }) + T(cx, h - m - z / 2 + 4, i + 1, { size: 10, fill: C.muted, anchor: 'middle' }); }
    }
    for (let j = 0; j <= ny; j++) {
      const y = iy + ih * j / ny;
      if (j > 0 && j < ny) b += L(m, y, ix, y, { c: C.faint, w: W.hair }) + L(w - m, y, w - ix, y, { c: C.faint, w: W.hair });
      if (j < ny) { const cy = iy + ih * (j + .5) / ny + 4, ch = String.fromCharCode(65 + j); b += T(m + z / 2, cy, ch, { size: 10, fill: C.muted, anchor: 'middle' }) + T(w - m - z / 2, cy, ch, { size: 10, fill: C.muted, anchor: 'middle' }); }
    }
    // centering marks (triangles) at mid edges
    b += P(`M${w / 2 - 6} ${iy - 9}L${w / 2 + 6} ${iy - 9}L${w / 2} ${iy - 1}Z`, { fill: C.ink, c: 'none' }) + P(`M${w / 2 - 6} ${h - iy + 9}L${w / 2 + 6} ${h - iy + 9}L${w / 2} ${h - iy + 1}Z`, { fill: C.ink, c: 'none' });
  }
  return { defs, body: b, inner: { x: m + z, y: m + z, w: w - 2 * (m + z), h: h - 2 * (m + z) } };
}

// Wrap everything as a standalone SVG document.
// pad: transparent margin (viewBox units) so every image in the README shares the same edge inset.
export function svgDoc({ w, h, title, desc, fonts = [], css = '', defs = '', body, pad = 6 }) {
  if (pad) { body = `<g transform="translate(${pad} ${pad})">${body}</g>`; w += 2 * pad; h += 2 * pad; }
  const base = `.spin{transform-box:view-box}` +
    `@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">` +
    `<title id="t">${esc(title)}</title><desc id="d">${esc(desc || title)}</desc>` +
    `<style>${fontFace(fonts)}${base}${css}</style><defs>${defs}</defs>${body}</svg>`;
}

// Standard sheet heading: boxed sheet number + title + subtitle.
export function sheetHead(x, y, no, title, sub, o = {}) {
  const bw = 66;
  return R(x, y, bw, 46, { c: C.ink, w: W.med }) + T(x + bw / 2, y + 14, 'SHEET', { size: 9, fill: C.muted, anchor: 'middle', ls: 2 }) +
    T(x + bw / 2, y + 38, no, { size: 22, font: 'disp', fill: C.ink, anchor: 'middle' }) +
    T(x + bw + 16, y + 27, title, { size: o.size || 26, font: 'disp', fill: C.ink, ls: 1 }) +
    (sub ? T(x + bw + 17, y + 44, sub, { size: 11.5, fill: C.muted, ls: 2 }) : '');
}
