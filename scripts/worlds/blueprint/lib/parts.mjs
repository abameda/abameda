// Reusable drawing furniture: title-block cells, projection symbol, redline marks, stamps.
import { C, W, T, L, R, P, Ci, DASH, r2, esc, FONT } from './svg.mjs';

// One title-block cell: tiny label + value.
export function cell(x, y, w, h, label, value, o = {}) {
  let s = R(x, y, w, h, { c: C.line, w: W.thin });
  s += T(x + 7, y + 12, label, { size: 9.5, fill: C.muted, ls: 1.2 });
  if (value != null) s += T(o.center ? x + w / 2 : x + 7, y + h - (o.vb ?? 9), value, { size: o.size || 13, font: o.font || 'mono', fill: o.fill || C.ink, anchor: o.center ? 'middle' : null, ls: o.ls ?? 0.5, tl: o.tl });
  return s;
}

// First/third angle projection symbol (truncated cone, two views). ISO 5456-2.
export function projSymbol(x, y, s = 1, third = true) {
  const k = v => r2(v * s);
  const cone = `<path d="M0 ${k(-9)}L${k(28)} ${k(-15)}L${k(28)} ${k(15)}L0 ${k(9)}Z" fill="none" stroke="${C.ink}" stroke-width="${W.med}"/>`;
  const circ = `<circle r="${k(15)}" fill="none" stroke="${C.ink}" stroke-width="${W.med}"/><circle r="${k(9)}" fill="none" stroke="${C.ink}" stroke-width="${W.med}"/>`;
  const cl = `<line x1="${k(-20)}" x2="${k(84)}" y1="0" y2="0" stroke="${C.thin}" stroke-width="${W.hair}" stroke-dasharray="${DASH.center}"/>`;
  const a = third ? 0 : 52, b = third ? 62 : 8;
  return `<g transform="translate(${r2(x)} ${r2(y)})">${cl}<g transform="translate(${k(a)} 0)">${cone}</g><g transform="translate(${k(b)} 0)">${circ}<line x1="0" x2="0" y1="${k(-20)}" y2="${k(20)}" stroke="${C.thin}" stroke-width="${W.hair}" stroke-dasharray="6 3 2 3"/></g></g>`;
}

// Deterministic pseudo-random for hand-drawn wobble.
export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Loose red-pen ellipse (overshooting stroke, like a reviewer circling something).
export function redCircle(cx, cy, rx, ry, seed = 7, o = {}) {
  const rnd = rng(seed), n = 34, pts = [];
  for (let i = 0; i <= n + 5; i++) {
    const a = -Math.PI * 0.62 + i / n * Math.PI * 2;
    const j = 1 + (rnd() - 0.5) * 0.05 + i / n * 0.06;
    pts.push([cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j]);
  }
  let d = `M${r2(pts[0][0])} ${r2(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += `Q${r2(pts[i][0])} ${r2(pts[i][1])} ${r2(mx)} ${r2(my)}`;
  }
  return `<path d="${d}" fill="none" stroke="${C.red}" stroke-width="${o.w || 2.4}" stroke-linecap="round"${o.cls ? ` class="${o.cls}"` : ''}/>`;
}

// Hand-drawn arrow from a to b with a slight bow.
export function redArrow(x1, y1, x2, y2, o = {}) {
  const mx = (x1 + x2) / 2 + (o.bow ?? 0.18) * (y2 - y1), my = (y1 + y2) / 2 - (o.bow ?? 0.18) * (x2 - x1);
  const a = Math.atan2(y2 - my, x2 - mx), s = 13;
  const h1 = [x2 - Math.cos(a - 0.45) * s, y2 - Math.sin(a - 0.45) * s], h2 = [x2 - Math.cos(a + 0.42) * s, y2 - Math.sin(a + 0.42) * s];
  return `<path d="M${r2(x1)} ${r2(y1)}Q${r2(mx)} ${r2(my)} ${r2(x2)} ${r2(y2)}M${r2(h1[0])} ${r2(h1[1])}L${r2(x2)} ${r2(y2)}L${r2(h2[0])} ${r2(h2[1])}" fill="none" stroke="${C.red}" stroke-width="${o.w || 2.2}" stroke-linecap="round" stroke-linejoin="round"${o.cls ? ` class="${o.cls}"` : ''}/>`;
}

// Red-pen handwriting.
export const redNote = (x, y, str, o = {}) =>
  `<text x="${r2(x)}" y="${r2(y)}" font-family="${FONT.hand}" font-size="${o.size || 22}" fill="${C.red}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.rot ? ` transform="rotate(${o.rot} ${r2(x)} ${r2(y)})"` : ''}${o.cls ? ` class="${o.cls}"` : ''}>${esc(str)}</text>`;

// A tick mark drawn by hand.
export const redTick = (x, y, s = 1) =>
  `<path d="M${r2(x)} ${r2(y)}l${r2(6 * s)} ${r2(8 * s)}l${r2(15 * s)} ${r2(-20 * s)}" fill="none" stroke="${C.red}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;

// Leader with a horizontal shoulder and text label (callout).
export function callout(px, py, tx, ty, lines, o = {}) {
  const left = tx < px, sh = o.shoulder ?? 18, ex = left ? tx + sh : tx - sh;
  let s = `<circle cx="${r2(px)}" cy="${r2(py)}" r="2.6" fill="${C.ink}"/>` + L(px, py, ex, ty, { c: C.thin, w: W.hair }) + L(ex, ty, tx, ty, { c: C.thin, w: W.hair });
  const ax = left ? tx - 6 : tx + 6, anchor = left ? 'end' : 'start';
  lines.forEach((ln, i) => {
    s += T(ax, ty + 4 + i * (o.lh || 17), ln.t ?? ln, { size: ln.size || (i ? 11.5 : 14), fill: ln.fill || (i ? C.muted : C.ink), anchor, ls: ln.ls ?? (i ? 1.2 : 1.6), font: ln.font });
  });
  return s;
}
