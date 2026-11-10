// Isometric engine. World axes: x runs down-right, y runs down-left, z runs up.
// Visible faces: top (+z), right (+x, warm sun side), left (+y, cool shade side).
import { f, shade, mix } from './svg.mjs';

const C = Math.cos(Math.PI / 6);
let gid = 0;

export function iso(ox, oy, S, prefix = 'g') {
  const I = { S, defs: '' };
  const P = (x, y, z = 0) => [ox + (x - y) * C * S, oy + (x + y) * 0.5 * S - z * S];
  const pts = arr => arr.map(p => `${f(p[0])},${f(p[1])}`).join(' ');
  const poly = (arr, fill, extra = '') => `<polygon points="${pts(arr)}" fill="${fill}" stroke="${fill}" stroke-width=".6" stroke-linejoin="round" ${extra}/>`;
  const M = m => (typeof m === 'string' ? shade(m) : m);
  I.P = P; I.pts = pts; I.poly = poly; I.M = M;

  // Affine matrices that map face-local units (u right, v down) onto a face, so plain
  // rects/circles/text drawn inside land in correct perspective on that face.
  I.mLeft = (x0, yPlane, zTop) => { const [a, b] = P(x0, yPlane, zTop); return `matrix(${f(C * S)},${f(0.5 * S)},0,${f(S)},${f(a)},${f(b)})`; };
  I.mRight = (xPlane, yFar, zTop) => { const [a, b] = P(xPlane, yFar, zTop); return `matrix(${f(C * S)},${f(-0.5 * S)},0,${f(S)},${f(a)},${f(b)})`; };
  I.mTop = (x0, y0, z) => { const [a, b] = P(x0, y0, z); return `matrix(${f(C * S)},${f(0.5 * S)},${f(-C * S)},${f(0.5 * S)},${f(a)},${f(b)})`; };

  // lite: no seam strokes and no rim light, for districts with hundreds of small boxes.
  const polyLite = (arr, fill) => `<polygon points="${pts(arr)}" fill="${fill}"/>`;
  I.box = (x, y, z, w, d, h, mat, { top = true, extra = '', lite = false } = {}) => {
    const m = M(mat), pp = lite ? polyLite : poly;
    let s = lite && !extra ? '' : `<g ${extra}>`;
    s += pp([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], m.right);
    s += pp([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], m.left);
    if (top) s += pp([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], m.top);
    if (lite) return s + (extra ? '</g>' : '');
    // crisp rim light on the corner that faces the viewer
    const [ax, ay] = P(x + w, y + d, z), [bx, by] = P(x + w, y + d, z + h);
    s += `<line x1="${f(ax)}" y1="${f(ay)}" x2="${f(bx)}" y2="${f(by)}" stroke="${mix(m.right, '#ffffff', 0.25)}" stroke-width=".8" opacity=".55"/>`;
    return s + '</g>';
  };
  I.topFace = (x, y, z, w, d, fill, extra = '') => poly([P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], fill, extra);

  // Long dusk shadow falling down-left (sun low on the right).
  I.shadow = (x, y, w, d, h, k = 0.55, op = 0.32) => {
    const sx = -0.15 * h * k, sy = 0.95 * h * k;
    return `<polygon points="${pts([P(x + w, y), P(x + w, y + d), P(x + w + sx, y + d + sy), P(x + sx, y + d + sy), P(x + sx, y + sy), P(x, y)])}" fill="#0b0620" opacity="${op}"/>`;
  };

  // Gradient registry (per document)
  I.grad = (stops, x1 = 0, y1 = 0, x2 = 1, y2 = 0) => {
    const id = `${prefix}${++gid}`;
    I.defs += `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
    return `url(#${id})`;
  };

  // Vertical cylinder: centre (cx,cy), from z0 to z1, radius r.
  I.cyl = (cx, cy, z0, z1, r, mat, { cap = true } = {}) => {
    const m = M(mat), rx = 1.2247 * r * S, ry = 0.7071 * r * S;
    const [bx, by] = P(cx, cy, z0), [tx, ty] = P(cx, cy, z1);
    const g = I.grad([[0, m.left], [0.55, m.base], [1, m.right]]);
    let s = `<path d="M${f(tx - rx)} ${f(ty)} L${f(bx - rx)} ${f(by)} A${f(rx)} ${f(ry)} 0 0 0 ${f(bx + rx)} ${f(by)} L${f(tx + rx)} ${f(ty)} Z" fill="${g}"/>`;
    if (cap) s += `<ellipse cx="${f(tx)}" cy="${f(ty)}" rx="${f(rx)}" ry="${f(ry)}" fill="${m.top}"/>`;
    return s;
  };
  I.ell = (cx, cy, z, r, fill, extra = '') => { const [x, y] = P(cx, cy, z); return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1.2247 * r * S)}" ry="${f(0.7071 * r * S)}" fill="${fill}" ${extra}/>`; };

  // Hemisphere dome resting on z.
  I.dome = (cx, cy, z, r, mat) => {
    const m = M(mat), R = 1.2247 * r * S, ry = 0.7071 * r * S, [x, y] = P(cx, cy, z);
    const id = `${prefix}${++gid}`;
    I.defs += `<radialGradient id="${id}" cx=".68" cy=".25" r=".9"><stop offset="0" stop-color="${m.top}"/><stop offset=".55" stop-color="${m.base}"/><stop offset="1" stop-color="${m.left}"/></radialGradient>`;
    return `<path d="M${f(x - R)} ${f(y)} A${f(R)} ${f(R)} 0 0 1 ${f(x + R)} ${f(y)} A${f(R)} ${f(ry)} 0 0 1 ${f(x - R)} ${f(y)} Z" fill="url(#${id})"/>`;
  };

  // Square pyramid roof on (x,y,w,d) at z, apex height h.
  I.pyramid = (x, y, z, w, d, h, mat) => {
    const m = M(mat), apex = P(x + w / 2, y + d / 2, z + h);
    return poly([P(x + w, y, z), P(x + w, y + d, z), apex], m.right) + poly([P(x, y + d, z), P(x + w, y + d, z), apex], m.left);
  };

  // Gable roof, ridge running along x.
  I.gableX = (x, y, z, w, d, h, mat) => {
    const m = M(mat), ry = y + d / 2;
    return poly([P(x, y, z), P(x + w, y, z), P(x + w, ry, z + h), P(x, ry, z + h)], mix(m.top, m.left, 0.35))
      + poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, ry, z + h), P(x, ry, z + h)], m.top)
      + poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, ry, z + h)], m.right);
  };

  // Grid of windows on a face, in face-local units. lit(i) decides which glow.
  // face: 'left' (plane y = yPlane, u along x) or 'right' (plane x = xPlane, u along -y).
  I.windows = (face, a, b, zTop, { cols, rows, u0 = 0.3, v0 = 0.5, du = 0.5, dv = 0.7, gu = 0.35, gv = 0.45, lit = () => true, on = '#ffc463', off = '#2a1f4f', flick = () => '' }) => {
    const m = face === 'left' ? I.mLeft(a, b, zTop) : I.mRight(a, b, zTop);
    let s = `<g transform="${m}">`, i = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++, i++) {
      const L = lit(i), fl = L ? flick(i) : '';
      s += `<rect x="${f(u0 + c * (du + gu))}" y="${f(v0 + r * (dv + gv))}" width="${du}" height="${dv}" fill="${L ? on : off}" ${fl}/>`;
    }
    return s + '</g>';
  };
  return I;
}

// A warm, slightly varied window colour so lit floors don't look like a flat grid.
export const warm = i => ['#ffc463', '#ffd27e', '#ffb65c', '#ffe1a3', '#ffc874'][i % 5];
