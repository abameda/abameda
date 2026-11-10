// Market Street: the toolbox as a corner block of late-night shops, drawn with the same isometric
// engine and light model as the rest of the city. One shop per toolbox group: its neon sign is the
// group, its window is lettered with the tools. The language meter is live (data.json).
import { svgDoc, f, esc, P as PAL, mix, shade } from './svg.mjs';
import { iso } from './iso.mjs';
import { MOTION } from './motion.mjs';
import { tree, palm, lamp } from './buildings-b.mjs';
import { postPlate } from './plate.mjs';
import { meter } from './meter.mjs';

export const NEON = ['#ff7a6b', '#6fe3e1', '#ffc463', '#ff9db0', '#b9a2ff'];
const BODY = ['#6a3f63', '#3d4f86', '#7a5a46', '#4a3f80', '#6a4a7a'];
const D = 5, H = 7, WALK = 1.8;

// Everything on a shop front, in face-local units (u along the front, v down from the roof line).
function front(name, items, w, col, i) {
  const glow = mix(col, '#ffffff', 0.55), size = 0.86, cls = i === 3 ? 'neonbad' : '';
  let s = `<rect x=".4" y=".5" width="${f(w - 0.8)}" height="1.1" rx=".12" fill="#120a24" stroke="#3a2c58" stroke-width=".04"/>`;
  s += `<g class="${cls}"><text x="${f(w / 2)}" y="1.36" text-anchor="middle" class="d" font-size="${size}" letter-spacing=".06" fill="none" stroke="${col}" stroke-width=".22" stroke-opacity=".3">${esc(name)}</text>`
    + `<text x="${f(w / 2)}" y="1.36" text-anchor="middle" class="d" font-size="${size}" letter-spacing=".06" fill="${glow}" stroke="${col}" stroke-width=".04">${esc(name)}</text></g>`;
  // window, lit from inside, lettered in gilt
  const wy = 2.6, wh = H - wy - 0.42;
  s += `<rect x=".35" y="${wy - 0.1}" width="${f(w - 0.7)}" height="${f(wh + 0.2)}" fill="#2c2048"/><rect x=".5" y="${wy}" width="${f(w - 1)}" height="${f(wh)}" fill="url(#shopWin)"/>`;
  // more than four tools: two columns, so the lettering stays large
  const n = items.length, { cols, rows, longest } = layout(items);
  const fs = Math.min(0.58, (w - 1.2) / cols / (longest * 0.6 + 0.3), (wh - 0.8) / (rows * 1.3)), lh = fs * 1.32;
  const y0 = wy + (wh - 0.42) / 2 - (lh * (rows - 1)) / 2 + fs * 0.34;
  items.forEach((t, k) => {
    const c = Math.floor(k / rows), r = k % rows, cx = cols === 1 ? w / 2 : 0.6 + ((w - 1.2) / cols) * (c + 0.5);
    s += `<text x="${f(cx)}" y="${f(y0 + r * lh)}" text-anchor="middle" class="m" font-size="${f(fs)}" fill="#ffe6b0" letter-spacing=".02">${esc(t)}</text>`;
  });
  s += `<rect x=".5" y="${f(wy + wh - 0.42)}" width="${f(w - 1)}" height=".42" fill="#ffb65c" opacity=".16"/>`
    + `<text x="${f(w / 2)}" y="${f(wy + wh - 0.13)}" text-anchor="middle" class="m" font-size=".24" fill="#ffcf8a" letter-spacing=".05">${String(n).padStart(2, '0')} IN STOCK</text>`;
  s += `<polygon points=".5,${wy} 1.6,${wy} .5,${f(wy + 1.1)}" fill="#fff" opacity=".07"/>`;
  return s;
}

function layout(items) {
  const cols = items.length > 4 ? 2 : 1, rows = Math.ceil(items.length / cols);
  return { cols, rows, longest: Math.max(...items.map(t => t.length)) };
}
// front width that lets the window lettering reach a readable size
const shopWidth = items => { const { cols, longest } = layout(items); return Math.max(5.4, Math.min(8.6, cols * (longest * 0.6 + 0.3) * 0.5 + 1.3)); };

// striped awning sticking out of a front; along = 'x' for left faces, 'y' for right faces
function awning(I, along, a0, a1, plane, z, col) {
  const n = Math.max(4, Math.round((a1 - a0) / 0.55)), st = (a1 - a0) / n, out = 0.55, drop = 0.36;
  let s = '';
  for (let k = 0; k < n; k++) {
    const u0 = a0 + k * st, u1 = u0 + st, c = k % 2 ? mix(col, '#1a1131', 0.3) : '#efe2d0';
    const P = along === 'x' ? (u, o, zz) => I.P(u, plane + o, zz) : (u, o, zz) => I.P(plane + o, u, zz);
    s += I.poly([P(u0, 0, z), P(u1, 0, z), P(u1, out, z - drop), P(u0, out, z - drop)], c);
    s += I.poly([P(u0, out, z - drop), P(u1, out, z - drop), P(u1, out, z - drop - 0.16), P(u0, out, z - drop - 0.16)], mix(c, '#000', 0.12));
  }
  return s;
}

// The corner block itself (plinth, pavement, shops, roof furniture, lamps), centred on cx with the
// farthest roof just under `top`; shared by the desktop street and the phone version.
export function marketBlock(profile, { S = 25, cx = 600, top = 40 } = {}) {
  const groups = Object.entries(profile.toolbox), n = groups.length;
  const widths = groups.map(([, v]) => shopWidth(v));
  const nl = Math.ceil(n / 2), left = groups.slice(0, nl), right = groups.slice(nl);
  const Lx = widths.slice(0, nl).reduce((a, b) => a + b, 0), Ry = widths.slice(nl).reduce((a, b) => a + b, 0), Ly = Ry + D;
  // centre the block; the farthest roof (with its water tank) sits just under the top edge
  const ox = cx - ((Lx + WALK) - (Ly + WALK)) * 0.866 * S / 2, oy = top + (H + 1.4) * S - Math.min(Ry, Lx - D) * 0.5 * S;
  const I = iso(ox, oy, S, 'm');
  // plinth with the same strata as the hero, pavement in front of both wings
  const X0 = -0.6, Y0 = -0.6, XW = Lx + WALK + 0.6, YW = Ly + WALK + 0.6;
  let s = I.box(X0, Y0, -1.2, XW, YW, 0.55, '#24173a', { top: false }) + I.box(X0, Y0, -0.65, XW, YW, 0.65, '#4c2f62', { top: false });
  s += I.topFace(X0, Y0, 0, XW, YW, '#3a2a58');
  s += I.topFace(0, Ly, 0.01, Lx + WALK, WALK, '#2c2148') + I.topFace(Lx, 0, 0.012, WALK, Ly, '#2c2148');
  s += `<g transform="${I.mTop(0, Ly + WALK - 0.12, 0.02)}"><rect width="${f(Lx + WALK)}" height=".12" fill="#5a4a8a"/></g><g transform="${I.mTop(Lx + WALK - 0.12, 0, 0.02)}"><rect width=".12" height="${f(Ly + WALK)}" fill="#5a4a8a"/></g>`;
  // courtyard behind the shops
  s += tree(I, 2.5, 2.5, 1.1) + palm(I, Lx * 0.45, 3, 3) + tree(I, Lx - D - 1.5, 1.5, 0.9) + tree(I, 6, Ry * 0.6, 0.8);

  const shops = [];
  let x = 0;
  left.forEach(([k, v], i) => { shops.push({ k, v, i, face: 'left', x, y: Ry, w: widths[i], d: D }); x += widths[i]; });
  let y = 0;
  right.forEach(([k, v], j) => { const i = nl + j; shops.push({ k, v, i, face: 'right', x: Lx - D, y, w: D, d: widths[i] }); y += widths[i]; });
  shops.sort((a, b) => a.x + a.w / 2 + a.y + a.d / 2 - (b.x + b.w / 2 + b.y + b.d / 2));
  for (const sh of shops) {
    const col = NEON[sh.i % NEON.length], body = BODY[sh.i % BODY.length], m = shade(body);
    s += I.box(sh.x, sh.y, 0, sh.w, sh.d, H, m);
    s += I.box(sh.x - 0.06, sh.y - 0.06, H, sh.w + 0.12, sh.d + 0.12, 0.22, mix(body, '#ffffff', 0.2));
    const fw = sh.face === 'left' ? sh.w : sh.d;
    const mtx = sh.face === 'left' ? I.mLeft(sh.x, sh.y + sh.d, H) : I.mRight(sh.x + sh.w, sh.y + sh.d, H);
    s += `<g transform="${mtx}">${front(sh.k.toUpperCase(), sh.v, fw, col, sh.i)}</g>`;
    s += sh.face === 'left' ? awning(I, 'x', sh.x + 0.4, sh.x + sh.w - 0.4, sh.y + sh.d, H - 1.72, col) : awning(I, 'y', sh.y + 0.4, sh.y + sh.d - 0.4, sh.x + sh.w, H - 1.72, col);
    // roof furniture: a water tank on legs and an AC box
    const tx = sh.x + sh.w * 0.3, ty = sh.y + sh.d * 0.35;
    s += I.box(tx - 0.3, ty - 0.3, H + 0.22, 0.08, 0.08, 0.5, '#8a7ab8') + I.box(tx + 0.3, ty + 0.3, H + 0.22, 0.08, 0.08, 0.5, '#8a7ab8');
    s += I.cyl(tx, ty, H + 0.7, H + 1.35, 0.45, '#c9c3e3') + I.box(sh.x + sh.w * 0.65, sh.y + sh.d * 0.6, H + 0.22, 0.8, 0.6, 0.45, '#9a90c0');
  }
  // the corner shop's side wall gets upper windows
  const corner = shops.find(sh => sh.face === 'left' && Math.abs(sh.x + sh.w - Lx) < 0.01);
  if (corner) s += I.windows('right', Lx, Ly, H, { cols: 3, rows: 2, u0: 0.6, v0: 0.6, du: 0.7, dv: 0.6, gu: 0.75, gv: 0.45, on: '#ffc463' });
  // lamps along the kerb
  for (let k = 1; k < nl; k++) s += lamp(I, widths.slice(0, k).reduce((a, b) => a + b, 0), Ly + WALK - 0.35);
  for (let k = 1; k < right.length; k++) s += lamp(I, Lx + WALK - 0.35, widths.slice(nl, nl + k).reduce((a, b) => a + b, 0));
  return { s, I, Lx, Ly, groups };
}

export function toolbox(data, profile) {
  const langs = (data.languages || []).length > 0, Wd = 1200, Ht = langs ? 660 : 590;
  let { s, I, Lx, Ly, groups } = marketBlock(profile);

  // the street plate on its post at the corner of the pavement, the meter as a board on the left
  const [px, py] = I.P(Lx + WALK + 0.2, Ly - 2.2, 0);
  s += postPlate(px + 128, py + 78, 'market', { height: 142, en: 22, ar: 20 }).svg;
  if (langs) s += meter(data, 52, Ht - 118, 384);

  const defs = `<clipPath id="frm"><rect width="${Wd}" height="${Ht}" rx="24"/></clipPath>
<linearGradient id="bgm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#160d33"/><stop offset=".65" stop-color="#2a1550"/><stop offset="1" stop-color="#4a2160"/></linearGradient>
<radialGradient id="glm" cx=".5" cy=".7" r=".55"><stop offset="0" stop-color="#ff8a6b" stop-opacity=".3"/><stop offset="1" stop-color="#ff8a6b" stop-opacity="0"/></radialGradient>
<linearGradient id="shopWin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1f45"/><stop offset=".7" stop-color="#5a2a4a"/><stop offset="1" stop-color="#8a4048"/></linearGradient>
<radialGradient id="lampGlow"><stop offset="0" stop-color="#ffd58a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd58a" stop-opacity="0"/></radialGradient>${I.defs}`;
  const css = MOTION + '.neonbad{animation:nb 14s ease-in-out infinite}@keyframes nb{0%,92.6%,100%{opacity:1}93.4%{opacity:.6}94.3%{opacity:1}}';
  const body = `<g clip-path="url(#frm)"><rect width="${Wd}" height="${Ht}" fill="url(#bgm)"/><rect width="${Wd}" height="${Ht}" fill="url(#glm)"/>${s}</g>`
    + `<rect x=".75" y=".75" width="${Wd - 1.5}" height="${Ht - 1.5}" rx="23.5" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1.5"/>`;
  const alt = groups.map(([k, v]) => `${k}: ${v.join(', ')}`).join('; ');
  return svgDoc({ w: Wd, h: Ht, title: 'Market Street: the toolbox', desc: alt, css, defs, body, fonts: { arabic: true } });
}
