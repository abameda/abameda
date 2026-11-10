// Neighbourhood buildings (MNU hall, Thread atelier, print shop, Yosr site) and street props.
import { f, P as PAL, mix } from './svg.mjs';
import { W } from './buildings-a.mjs';

function gableY(I, x, y, z, w, d, h, mat) {
  const m = I.M(mat), P = I.P, rx = x + w / 2;
  return I.poly([P(x, y, z), P(x, y + d, z), P(rx, y + d, z + h), P(rx, y, z + h)], mix(m.top, m.left, 0.4))
    + I.poly([P(x + w, y, z), P(x + w, y + d, z), P(rx, y + d, z + h), P(rx, y, z + h)], mix(m.top, m.right, 0.35))
    + I.poly([P(x, y + d, z), P(x + w, y + d, z), P(rx, y + d, z + h)], m.left);
}

export function mnu(I, x, y) {
  const w = 3.6, d = 4.6, stone = '#d3bda3';
  let s = I.shadow(x, y, w, d, 5);
  s += I.box(x - 0.2, y - 0.2, 0, w + 0.4, d + 0.6, 0.35, '#b9a48f');
  s += I.box(x, y, 0.35, w, d, 2.7, stone);
  s += I.windows('right', x + w, y + d, 3.05, { cols: 5, rows: 2, u0: 0.35, v0: 0.4, du: 0.45, dv: 0.85, gu: 0.4, gv: 0.4, on: W });
  s += `<g transform="${I.mLeft(x, y + d, 3.05)}"><rect x=".3" y=".5" width="${w - 0.6}" height="2.2" fill="#5a3d4a"/><path d="M1.45 2.7 v-1.1 a.35 .35 0 0 1 .7 0 v1.1z" fill="#ffd58a"/></g>`;
  for (let i = 0; i < 5; i++) s += I.box(x + 0.25 + i * 0.78, y + d + 0.12, 0.35, 0.22, 0.22, 2.7, '#f3e6d4');
  s += I.box(x - 0.1, y - 0.05, 3.05, w + 0.2, d + 0.45, 0.32, '#e9d8c3');
  s += gableY(I, x - 0.1, y - 0.05, 3.37, w + 0.2, d + 0.45, 1.2, '#c48c72');
  s += `<g transform="${I.mLeft(x - 0.1, y + d + 0.4, 4.57)}"><circle cx="${f((w + 0.2) / 2)}" cy=".75" r=".22" fill="#ffd58a"/></g>`;
  return { svg: s, pin: I.P(x + w / 2, y + d / 2, 4.6) };
}

export function thread(I, x, y) {
  let s = I.shadow(x, y, 3, 3, 4);
  s += I.box(x, y, 0, 3, 3, 2.6, '#a8506a');
  s += I.windows('right', x + 3, y + 3, 2.6, { cols: 2, rows: 1, u0: 0.4, v0: 0.5, du: 0.8, dv: 0.9, gu: 0.6, on: W });
  // shop window with a 3D point-cloud mannequin
  s += `<g transform="${I.mLeft(x, y + 3, 2.6)}"><rect x=".3" y=".75" width="2.4" height="1.6" fill="#ffcf8a"/>`;
  const dots = [];
  for (let k = 0; k < 26; k++) { const t = k / 25, yy = 0.95 + t * 1.3, half = 0.12 + Math.sin(t * Math.PI) * 0.28 - (t < 0.2 ? 0.12 : 0); dots.push([1.5 - half, yy], [1.5 + half, yy]); }
  s += dots.map(([u, v]) => `<circle cx="${f(u)}" cy="${f(v)}" r=".035" fill="#7a2f4a"/>`).join('') + '</g>';
  // striped awning
  for (let i = 0; i < 6; i++) {
    const u0 = x + 0.25 + i * 0.42, u1 = u0 + 0.42;
    s += I.poly([I.P(u0, y + 3, 2.45), I.P(u1, y + 3, 2.45), I.P(u1, y + 3.55, 2.05), I.P(u0, y + 3.55, 2.05)], i % 2 ? PAL.cream : '#e0566e');
  }
  // giant spool on the roof, a loose thread trailing down the warm face
  s += I.cyl(x + 1.5, y + 1.5, 2.6, 2.78, 0.85, '#d9a77a');
  s += I.cyl(x + 1.5, y + 1.5, 2.78, 3.6, 0.55, '#e2475f');
  s += I.cyl(x + 1.5, y + 1.5, 3.6, 3.78, 0.85, '#d9a77a');
  const [ax, ay] = I.P(x + 2.2, y + 1.9, 3.2), [bx, by] = I.P(x + 3, y + 0.6, 0.2);
  s += `<path d="M${f(ax)} ${f(ay)} C${f(ax + 30)} ${f(ay + 4)} ${f(bx - 10)} ${f(by - 40)} ${f(bx)} ${f(by)}" fill="none" stroke="#ff5b73" stroke-width="1.6"/>`;
  return { svg: s, pin: I.P(x + 1.5, y + 1.5, 3.8) };
}

export function printer(I, x, y) {
  let s = I.shadow(x, y, 3, 3, 3.2);
  s += I.box(x, y, 0, 3, 3, 2.2, '#3c5a96');
  s += I.windows('right', x + 3, y + 3, 2.2, { cols: 2, rows: 2, u0: 0.45, v0: 0.35, du: 0.7, dv: 0.55, gu: 0.6, gv: 0.3, on: W });
  s += `<g transform="${I.mLeft(x, y + 3, 2.2)}"><rect x=".35" y=".9" width=".8" height="1.3" fill="#ffd58a"/><text x="2.05" y=".55" text-anchor="middle" class="d" font-size=".42" fill="${PAL.cream}" letter-spacing=".05">PRINT</text></g>`;
  // printer head on the roof with a paper slot and a ticket feeding out
  s += I.box(x + 0.35, y + 0.35, 2.2, 2.3, 2.3, 0.75, '#e7e3f4');
  s += I.topFace(x + 0.6, y + 0.6, 2.96, 1.8, 1.8, '#c9c3e3');
  s += `<g transform="${I.mLeft(x + 0.35, y + 2.65, 2.95)}"><rect x=".4" y=".3" width="1.5" height=".12" fill="#2a1f4f"/>`
    + `<clipPath id="tk${Math.round(x * 10)}"><rect x=".3" y=".36" width="1.7" height="1.6"/></clipPath><g clip-path="url(#tk${Math.round(x * 10)})"><g class="feed">`
    + `<rect x=".5" y="-.5" width="1.3" height="2.1" fill="#fffaf0"/>` + [0, 1, 2, 3, 4, 5].map(k => `<rect x=".62" y="${f(-0.3 + k * 0.3)}" width="${k % 2 ? 0.7 : 1.0}" height=".06" fill="#8a7fb0"/>`).join('')
    + `</g></g><rect x="1.68" y=".5" width=".12" height=".08" fill="#6dffb0" class="blink"/></g>`;
  return { svg: s, pin: I.P(x + 1.5, y + 1.5, 3.0) };
}

export function yosr(I, x, y, { craneH = 7 } = {}) {
  let s = I.topFace(x, y, 0.01, 4, 4, '#4d3b48');
  // blueprint pinned on the lot: the plan comes first
  s += `<g transform="${I.mTop(x + 0.25, y + 2.35, 0.03)}"><rect width="1.9" height="1.4" fill="#2f5fb3"/>`
    + [0.35, 0.7, 1.05].map(v => `<line x1=".1" y1="${v}" x2="1.8" y2="${v}" stroke="#bcd3ff" stroke-width=".02" opacity=".6"/>`).join('')
    + `<rect x=".25" y=".2" width=".8" height=".7" fill="none" stroke="#fff" stroke-width=".04"/><rect x="1.05" y=".2" width=".6" height="1" fill="none" stroke="#fff" stroke-width=".04"/></g>`;
  s += I.box(x + 0.5, y + 0.4, 0, 2.6, 1.9, 0.25, '#8d86a6');
  const cols = [[0.5, 0.4], [3.0, 0.4], [0.5, 2.18], [3.0, 2.18], [1.75, 2.18]];
  cols.forEach(([cx, cy]) => { s += I.box(x + cx, y + cy, 0.25, 0.12, 0.12, 1.4, '#ffb347'); });
  s += I.box(x + 0.5, y + 0.4, 1.65, 2.6, 1.9, 0.12, '#a39cbc');
  cols.slice(0, 3).forEach(([cx, cy]) => { s += I.box(x + cx, y + cy, 1.77, 0.12, 0.12, 0.9, '#ffb347'); });
  // tower crane
  const mx = x + 3.45, my = y + 3.2;
  s += I.box(mx, my, 0, 0.28, 0.28, craneH, '#f2a541');
  for (let z = 0.5; z < craneH; z += 0.7) { const [a1, b1] = I.P(mx + 0.28, my + 0.28, z), [a2, b2] = I.P(mx + 0.28, my + 0.28, z + 0.7); s += `<line x1="${f(a1)}" y1="${f(b1)}" x2="${f(a2 - I.S * 0.24)}" y2="${f(b2 + I.S * 0.12)}" stroke="#a2602a" stroke-width=".8"/>`; }
  s += I.box(mx - 4.2, my + 0.02, craneH, 4.2, 0.24, 0.24, '#f2a541');
  s += I.box(mx + 0.28, my + 0.02, craneH, 1.4, 0.24, 0.24, '#f2a541');
  s += I.box(mx + 1.1, my - 0.05, craneH - 0.55, 0.6, 0.38, 0.55, '#7d7896');
  s += I.box(mx - 0.05, my - 0.05, craneH - 0.6, 0.38, 0.38, 0.6, '#ffe2a6');
  const [tx, ty] = I.P(mx - 2.4, my + 0.14, craneH), drop = I.S * (craneH - 2.6);
  const dx = -0.866 * I.S, dy = -0.5 * I.S;
  s += `<style>@keyframes trolley{0%,100%{transform:translate(0,0)}50%{transform:translate(${f(dx * 1.5)}px,${f(dy * 1.5)}px)}}</style>`;
  s += `<g class="trolley"><g transform="translate(${f(tx)},${f(ty)})"><rect x="-4" y="-2" width="8" height="4" fill="#5a5578"/>`
    + `<line x1="0" y1="2" x2="0" y2="${f(drop)}" stroke="#d9d3ee" stroke-width=".8"/>`
    + `<g class="sway" transform="translate(0,${f(drop)})"><path d="M-${f(I.S * 0.9)} 0 l${f(I.S * 1.8)} ${f(I.S * 0.9)} v3 l-${f(I.S * 1.8)} -${f(I.S * 0.9)}z" fill="#ffb347"/></g></g></g>`;
  const [lx, ly] = I.P(mx + 0.14, my + 0.14, craneH + 0.3);
  s += `<circle cx="${f(lx)}" cy="${f(ly)}" r="2.4" fill="#ff5d6c" class="blink"/>`;
  // site board
  s += I.box(x + 0.3, y + 3.55, 0, 0.08, 0.08, 1.0, '#6b5a4a') + I.box(x + 1.9, y + 3.55, 0, 0.08, 0.08, 1.0, '#6b5a4a');
  s += `<g transform="${I.mLeft(x + 0.2, y + 3.63, 1.45)}"><rect width="1.9" height=".6" fill="#ffe2a6"/><text x=".95" y=".27" text-anchor="middle" class="d" font-size=".26" fill="#3a2440">YOSR</text><text x=".95" y=".5" text-anchor="middle" class="m" font-size=".14" fill="#6b4a3a">IN DESIGN</text></g>`;
  return { svg: s, pin: I.P(mx + 0.14, my + 0.14, craneH + 0.35) };
}

// ---------- props ----------
export function tree(I, x, y, k = 1) {
  const [bx, by] = I.P(x, y, 0), [cx, cy] = I.P(x, y, 1.1 * k), r = I.S * 0.55 * k;
  return `<ellipse cx="${f(bx - r * 0.6)}" cy="${f(by + r * 0.35)}" rx="${f(r * 1.1)}" ry="${f(r * 0.45)}" fill="#0b0620" opacity=".3"/><line x1="${f(bx)}" y1="${f(by)}" x2="${f(cx)}" y2="${f(cy)}" stroke="#4a3248" stroke-width="${f(I.S * 0.12)}"/>`
    + `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="#2f6058"/><circle cx="${f(cx + r * 0.25)}" cy="${f(cy - r * 0.25)}" r="${f(r * 0.62)}" fill="#4a8a76"/>`;
}

export function palm(I, x, y, h = 2.6) {
  const [bx, by] = I.P(x, y, 0), [tx, ty] = I.P(x, y, h), lean = I.S * 0.35, L = I.S * 1.0;
  let s = `<path d="M${f(bx)} ${f(by)} Q${f(bx + lean * 1.4)} ${f((by + ty) / 2)} ${f(tx + lean)} ${f(ty)}" fill="none" stroke="#6a4a50" stroke-width="${f(I.S * 0.13)}" stroke-linecap="round"/>`;
  const X = tx + lean, Y = ty;
  [-160, -125, -90, -55, -20, 20, 200].forEach((a, i) => {
    const r = (a * Math.PI) / 180, ex = X + Math.cos(r) * L, ey = Y + Math.sin(r) * L * 0.6 + L * 0.25;
    s += `<path d="M${f(X)} ${f(Y)} Q${f(X + Math.cos(r) * L * 0.55)} ${f(Y + Math.sin(r) * L * 0.6 - L * 0.25)} ${f(ex)} ${f(ey)}" fill="none" stroke="${i % 2 ? '#3d7a66' : '#2c5c52'}" stroke-width="${f(I.S * 0.16)}" stroke-linecap="round"/>`;
  });
  return s;
}

export function lamp(I, x, y) {
  const [bx, by] = I.P(x, y, 0), [tx, ty] = I.P(x, y, 1.5);
  return `<line x1="${f(bx)}" y1="${f(by)}" x2="${f(tx)}" y2="${f(ty)}" stroke="#2a1d44" stroke-width="1.4"/><circle cx="${f(tx)}" cy="${f(ty)}" r="${f(I.S * 0.9)}" fill="url(#lampGlow)"/><circle cx="${f(tx)}" cy="${f(ty)}" r="1.8" fill="#fff0c8"/>`;
}

// A small car drawn at the world origin of the road (x,y); the caller animates its group.
export function car(I, x, y, color = '#e05a6a', alongX = true) {
  const w = alongX ? 0.9 : 0.5, d = alongX ? 0.5 : 0.9;
  let s = I.box(x, y, 0, w, d, 0.32, color) + I.box(x + (alongX ? 0.2 : 0.06), y + (alongX ? 0.06 : 0.2), 0.32, alongX ? 0.45 : 0.38, alongX ? 0.38 : 0.45, 0.22, mix(color, '#1a1236', 0.35));
  const [hx, hy] = alongX ? I.P(x + w, y + d / 2, 0.18) : I.P(x + w / 2, y + d, 0.18);
  s += `<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(I.S * 0.12 + 0.6)}" fill="#fff4c8"/><circle cx="${f(hx)}" cy="${f(hy)}" r="${f(I.S * 0.5)}" fill="url(#lampGlow)" opacity=".8"/>`;
  return s;
}

export function felucca(I, x, y) {
  const [bx, by] = I.P(x, y, 0.05), k = I.S;
  return `<path d="M${f(bx - k * 0.9)} ${f(by - k * 0.15)} L${f(bx + k * 0.9)} ${f(by - k * 0.35)} L${f(bx + k * 0.55)} ${f(by + k * 0.12)} L${f(bx - k * 0.6)} ${f(by + k * 0.22)}Z" fill="#2a1a3a"/>`
    + `<line x1="${f(bx)}" y1="${f(by - k * 0.2)}" x2="${f(bx + k * 0.1)}" y2="${f(by - k * 2.1)}" stroke="#3a2840" stroke-width="1"/>`
    + `<path d="M${f(bx - k * 0.75)} ${f(by - k * 0.45)} L${f(bx + k * 0.95)} ${f(by - k * 2.6)} L${f(bx + k * 0.55)} ${f(by - k * 0.5)}Z" fill="${PAL.cream}"/><path d="M${f(bx + k * 0.95)} ${f(by - k * 2.6)} L${f(bx + k * 0.55)} ${f(by - k * 0.5)} L${f(bx + k * 0.25)} ${f(by - k * 0.48)}Z" fill="#ffc9a8"/>`;
}
