// Landmark buildings: CORTEX tower, CORTEX OPS annex, DÖSE flacon, Amwag HQ, BOSLA observatory.
// Every building is drawn from a footprint origin (x,y) in world units with the shared iso engine,
// so the same building appears in the hero skyline and on its own postcard.
import { f, rng, P as PAL, mix, esc } from './svg.mjs';
import { warm } from './iso.mjs';

export const W = '%W%'; // window token, resolved later by lightUp()
const OFF = '#2b2052';

// Light exactly `n` of the window tokens in `svg` (deterministic), a few of them flicker.
export function lightUp(svg, n, seed) {
  const total = (svg.match(/fill="%W%"/g) || []).length;
  const r = rng(seed), order = [...Array(total).keys()];
  for (let i = total - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const lit = new Set(order.slice(0, Math.min(n, total)));
  let i = 0;
  const out = svg.replace(/fill="%W%"/g, () => {
    const k = i++;
    if (lit.has(k)) return `fill="${warm(k)}"${r() < 0.14 ? ` class="fl" style="animation-delay:-${f(r() * 14)}s"` : ''}`;
    return `fill="${OFF}"${r() < 0.06 ? ` class="fon" style="animation-delay:-${f(r() * 17)}s"` : ''}`;
  });
  return { svg: out, total, lit: lit.size };
}

// Rotating lighthouse beam seen in isometric: angle and length change as it turns.
export function beamKeyframes(name) {
  let k = '';
  for (let s = 0; s <= 24; s++) {
    const t = (s / 24) * 2 * Math.PI, dx = (Math.cos(t) - Math.sin(t)) * 0.866, dy = (Math.cos(t) + Math.sin(t)) * 0.5;
    const L = Math.hypot(dx, dy) / 1.2247, a = (Math.atan2(dy, dx) * 180) / Math.PI;
    const toward = Math.cos(t) + Math.sin(t); // >0 = pointing at the viewer
    k += `${f((s / 24) * 100)}%{transform:rotate(${f(a)}deg) scaleX(${f(L)});opacity:${f(toward > -0.2 ? 0.95 : 0.12)}}`;
  }
  return `@keyframes ${name}{${k}}`;
}

export function cortex(I, x, y, { beamLen = 360 } = {}) {
  let s = I.shadow(x, y, 4, 4, 15);
  s += I.box(x, y, 0, 4, 4, 1.6, '#28306c');
  s += I.windows('left', x, y + 4, 1.6, { cols: 1, rows: 1, u0: 0.5, v0: 0.45, du: 3, dv: 0.75, on: '#ffd58a' });
  s += I.windows('right', x + 4, y + 4, 1.6, { cols: 3, rows: 1, u0: 0.35, v0: 0.5, du: 0.9, dv: 0.6, gu: 0.33, on: W });
  s += I.box(x + 0.6, y + 0.6, 1.6, 2.8, 2.8, 11, '#2e3d8c');
  const win = { cols: 4, rows: 13, u0: 0.28, v0: 0.45, du: 0.38, dv: 0.5, gu: 0.3, gv: 0.3, on: W };
  s += I.windows('left', x + 0.6, y + 3.4, 12.6, win) + I.windows('right', x + 3.4, y + 3.4, 12.6, win);
  // cyan "neural" seams up the two visible faces
  s += `<g transform="${I.mLeft(x + 0.6, y + 3.4, 12.6)}"><rect x="1.36" y=".2" width=".06" height="10.6" fill="${PAL.teal}" opacity=".7"/></g>`;
  s += `<g transform="${I.mRight(x + 3.4, y + 3.4, 12.6)}"><rect x="1.36" y=".2" width=".06" height="10.6" fill="${PAL.teal}" opacity=".7"/></g>`;
  s += I.box(x + 1, y + 1, 12.6, 2, 2, 1.3, '#3b4fae');
  s += I.box(x + 1, y + 1, 13.9, 2, 2, 0.22, '#5fd6da');
  s += I.box(x + 1.9, y + 1.9, 14.12, 0.2, 0.2, 2.5, '#a7b2e6');
  const [bx, by] = I.P(x + 2, y + 2, 16.7);
  s += `<circle cx="${f(bx)}" cy="${f(by)}" r="22" fill="url(#beaconGlow)" class="pulse"/>`;
  s += `<g transform="translate(${f(bx)},${f(by)})"><g class="beam"><polygon points="0,-1.5 ${beamLen},-${beamLen * 0.075} ${beamLen},${beamLen * 0.075} 0,1.5" fill="url(#beamGrad)"/></g>`
    + `<g class="beam b2"><polygon points="0,-1.5 ${beamLen},-${beamLen * 0.075} ${beamLen},${beamLen * 0.075} 0,1.5" fill="url(#beamGrad)"/></g></g>`;
  s += `<circle cx="${f(bx)}" cy="${f(by)}" r="3.2" fill="#eaffff"/>`;
  return { svg: s, pin: I.P(x + 2, y + 2, 16.9) };
}

export function ops(I, x, y) {
  let s = I.shadow(x, y, 3, 3, 3.4);
  s += I.box(x, y, 0, 3, 3, 3.2, '#333f80');
  s += `<g transform="${I.mLeft(x, y + 3, 3.2)}"><rect x=".3" y=".45" width="2.4" height="1.5" fill="#141a42"/>`
    + [0.5, 0.9, 1.3, 1.7, 2.1].map((u, i) => `<rect x="${u}" y="${f(1.75 - [0.6, 0.9, 0.5, 1.1, 0.8][i])}" width=".26" height="${[0.6, 0.9, 0.5, 1.1, 0.8][i]}" fill="${i % 2 ? PAL.teal : PAL.amber}" opacity=".9"/>`).join('')
    + `<rect x=".3" y="2.35" width="2.4" height=".5" fill="#ffd58a" opacity=".85"/></g>`;
  s += I.windows('right', x + 3, y + 3, 3.2, { cols: 3, rows: 2, u0: 0.3, v0: 0.45, du: 0.6, dv: 0.75, gu: 0.3, gv: 0.45, on: W });
  // rooftop dish + antennas
  s += I.box(x + 0.4, y + 0.4, 3.2, 0.9, 0.9, 0.35, '#4b58a0');
  const [dx, dy] = I.P(x + 0.85, y + 0.85, 4.1);
  s += `<ellipse cx="${f(dx)}" cy="${f(dy)}" rx="${f(I.S * 0.75)}" ry="${f(I.S * 0.42)}" transform="rotate(-28 ${f(dx)} ${f(dy)})" fill="#d9dcf5"/><ellipse cx="${f(dx + 1)}" cy="${f(dy + 1)}" rx="${f(I.S * 0.5)}" ry="${f(I.S * 0.24)}" transform="rotate(-28 ${f(dx)} ${f(dy)})" fill="#aab0de"/>`;
  [[2.1, 0.6, 1.6], [2.5, 1.4, 1.1], [1.9, 2.2, 0.8]].forEach(([ax, ay, h], i) => {
    s += I.box(x + ax, y + ay, 3.2, 0.12, 0.12, h, '#b9bfe6');
    const [lx, ly] = I.P(x + ax + 0.06, y + ay + 0.06, 3.2 + h);
    s += `<circle cx="${f(lx)}" cy="${f(ly)}" r="2.2" fill="#ff5d6c" class="blink" style="animation-delay:-${i * 0.7}s"/>`;
  });
  return { svg: s, pin: I.P(x + 0.85, y + 0.85, 4.15) };
}

export function dose(I, x, y) {
  const bx = x + 0.5, by = y + 0.7, w = 2.6, d = 2.2, z0 = 0.35, h = 4.4;
  let s = I.shadow(x, y, 3.6, 3.6, 6);
  s += I.box(x, y, 0, 3.6, 3.6, z0, '#563a6f');
  s += I.box(bx + 0.15, by + 0.15, z0 + 0.1, w - 0.3, d - 0.3, 3.0, { top: '#ffc2a6', left: '#c4506a', right: '#ff8a72', base: '#ff8a72' });
  // glass shell
  const g = (pts, c, o) => `<polygon points="${I.pts(pts)}" fill="${c}" fill-opacity="${o}" stroke="#ffe9ef" stroke-opacity=".55" stroke-width=".9" stroke-linejoin="round"/>`;
  const Pp = I.P;
  s += g([Pp(bx + w, by, z0), Pp(bx + w, by + d, z0), Pp(bx + w, by + d, z0 + h), Pp(bx + w, by, z0 + h)], '#ffd9e4', 0.26);
  s += g([Pp(bx, by + d, z0), Pp(bx + w, by + d, z0), Pp(bx + w, by + d, z0 + h), Pp(bx, by + d, z0 + h)], '#b77fb0', 0.3);
  s += g([Pp(bx, by, z0 + h), Pp(bx + w, by, z0 + h), Pp(bx + w, by + d, z0 + h), Pp(bx, by + d, z0 + h)], '#fff0f5', 0.45);
  // shimmer sweeping across the warm face
  s += `<clipPath id="dsc${Math.round(x * 10)}"><rect x="0" y="0" width="${d}" height="${h}"/></clipPath>`
    + `<g transform="${I.mRight(bx + w, by + d, z0 + h)}"><g clip-path="url(#dsc${Math.round(x * 10)})"><polygon class="shim" points="0,0 .35,0 -.9,${h} -1.25,${h}" fill="#fff" opacity=".55"/></g></g>`;
  // label plate + door on the shade face
  s += `<g transform="${I.mLeft(bx, by + d, z0 + h)}"><rect x=".45" y="1.15" width="1.7" height=".95" fill="${PAL.cream}"/>`
    + `<text x="1.3" y="1.86" text-anchor="middle" class="d" font-size=".72" fill="#3a1d3f" letter-spacing=".04">DÖSE</text>`
    + `<path d="M.95 ${h} v-.9 a.35 .35 0 0 1 .7 0 v.9z" fill="#ffd9a0"/></g>`;
  s += I.cyl(bx + w / 2, by + d / 2, z0 + h, z0 + h + 0.55, 0.38, '#e9c7d4');
  s += I.box(bx + w / 2 - 0.6, by + d / 2 - 0.6, z0 + h + 0.55, 1.2, 1.2, 1.0, '#d7a24a');
  s += I.topFace(bx + w / 2 - 0.6, by + d / 2 - 0.6, z0 + h + 1.56, 1.2, 1.2, '#ffe2a0', 'opacity=".35"');
  return { svg: s, pin: I.P(x + 1.8, y + 1.8, 6.3) };
}

// Clock face drawn in face-local units; hour hand shows the refresh time (Cairo), minute hand ticks round.
function clock(cx, cy, r, hh, mm) {
  const ha = ((hh % 12) + mm / 60) * 30, ma = mm * 6;
  let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff3dc" stroke="#7a4a3a" stroke-width=".07"/>`;
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; s += `<line x1="${f(cx + Math.sin(a) * r * 0.78)}" y1="${f(cy - Math.cos(a) * r * 0.78)}" x2="${f(cx + Math.sin(a) * r * 0.92)}" y2="${f(cy - Math.cos(a) * r * 0.92)}" stroke="#7a4a3a" stroke-width=".05"/>`; }
  s += `<g transform="translate(${cx},${cy})"><line x1="0" y1="0" x2="0" y2="${f(-r * 0.5)}" stroke="#2a1a3a" stroke-width=".09" stroke-linecap="round" transform="rotate(${f(ha)})"/>`
    + `<g transform="rotate(${f(ma)})"><line class="minute" x1="0" y1="0" x2="0" y2="${f(-r * 0.78)}" stroke="#c4405a" stroke-width=".06" stroke-linecap="round"/></g></g>`;
  return s;
}

export function attendance(I, x, y, { hh = 12, mm = 0 } = {}) {
  const stone = '#c79d7a';
  let s = I.shadow(x, y, 5, 4, 8.5);
  s += I.topFace(x - 0.2, y + 4, 0.01, 5.4, 1.7, '#3c2c5e');
  s += I.box(x, y, 0, 5, 4, 5.4, stone);
  s += I.windows('left', x, y + 4, 5.4, { cols: 6, rows: 4, u0: 0.32, v0: 0.5, du: 0.42, dv: 0.6, gu: 0.33, gv: 0.42, on: W });
  s += I.windows('right', x + 5, y + 4, 5.4, { cols: 5, rows: 4, u0: 0.32, v0: 0.5, du: 0.42, dv: 0.6, gu: 0.3, gv: 0.42, on: W });
  s += `<g transform="${I.mLeft(x, y + 4, 5.4)}"><rect x="1.85" y="4.45" width="1.3" height=".95" fill="#ffd58a"/><rect x="2.47" y="4.45" width=".06" height=".95" fill="#a3683f"/></g>`;
  s += I.box(x - 0.12, y - 0.12, 5.4, 5.24, 4.24, 0.3, mix(stone, '#fff', 0.12));
  s += `<g transform="${I.mLeft(x - 0.12, y + 4.12, 5.7)}"><text x="2.62" y=".24" text-anchor="middle" class="m" font-size=".22" fill="#5a3426" letter-spacing=".08">AMWAG · ATTENDANCE</text></g>`;
  s += I.box(x + 1.7, y + 1.2, 5.7, 1.6, 1.6, 2.5, stone);
  s += `<g transform="${I.mLeft(x + 1.7, y + 2.8, 8.2)}">${clock(0.8, 1.05, 0.55, hh, mm)}</g>`;
  s += `<g transform="${I.mRight(x + 3.3, y + 2.8, 8.2)}">${clock(0.8, 1.05, 0.55, hh, mm)}</g>`;
  s += I.pyramid(x + 1.55, y + 1.05, 8.2, 1.9, 1.9, 1.5, '#8a4a63');
  s += I.box(x + 2.47, y + 1.97, 9.7, 0.06, 0.06, 0.9, '#e8d9c6');
  const [fx, fy] = I.P(x + 2.5, y + 2, 10.6);
  s += `<path class="flag" d="M${f(fx)} ${f(fy)} l${f(I.S * 0.75)} ${f(I.S * 0.2)} l-${f(I.S * 0.05)} ${f(I.S * 0.28)} l-${f(I.S * 0.7)} -${f(I.S * 0.14)}z" fill="${PAL.coral}"/>`;
  // turnstiles at the plaza: posts with status lights
  for (let i = 0; i < 4; i++) {
    const tx = x + 0.9 + i * 1.05;
    s += I.box(tx, y + 4.55, 0, 0.22, 0.6, 0.75, '#9aa0c8');
    const [lx, ly] = I.P(tx + 0.11, y + 4.85, 0.78);
    s += `<circle cx="${f(lx)}" cy="${f(ly)}" r="${f(I.S * 0.07 + 1)}" fill="${i === 2 ? '#ff6b6b' : '#6dffb0'}" class="${i === 2 ? 'blink' : ''}"/>`;
  }
  return { svg: s, pin: I.P(x + 2.5, y + 2, 10.65) };
}

export function bosla(I, x, y, { bars = [0.7, 1.3, 0.9, 1.8, 1.1, 0.6, 1.5, 1.0, 2.1, 0.8] } = {}) {
  let s = I.topFace(x - 0.6, y - 0.6, 0.01, 5.2, 5.2, '#3a2a66');
  s += `<g transform="${I.mTop(x - 0.6, y - 0.6, 0.02)}" opacity=".5">` + [1, 2, 3, 4].map(k => `<line x1="${k * 1.04}" y1="0" x2="${k * 1.04}" y2="5.2" stroke="${PAL.teal}" stroke-width=".03"/><line x1="0" y1="${k * 1.04}" x2="5.2" y2="${k * 1.04}" stroke="${PAL.teal}" stroke-width=".03"/>`).join('') + '</g>';
  s += I.shadow(x + 0.75, y + 0.75, 2.5, 2.5, 6);
  // data bars on the back and right edges of the plaza
  const spots = [[-0.4, -0.4], [0.6, -0.4], [1.6, -0.4], [2.6, -0.4], [3.6, -0.4], [4.1, 0.6], [4.1, 1.6], [4.1, 2.6], [4.1, 3.6], [-0.4, 0.6]];
  spots.forEach(([sx, sy], i) => { s += I.box(x + sx, y + sy, 0, 0.36, 0.36, bars[i % bars.length], i % 3 === 0 ? '#ff8f6b' : '#4fb9c9'); });
  s += I.cyl(x + 2, y + 2, 0, 4.4, 1.25, '#5a4a9c');
  // ring of lit slits wrapping the drum
  for (const z of [1.2, 2.4, 3.6]) for (let a = -70; a <= 70; a += 28) {
    const t = ((a + 45) * Math.PI) / 180, px = x + 2 + Math.cos(t) * 1.25, py = y + 2 + Math.sin(t) * 1.25;
    const [wx, wy] = I.P(px, py, z), sc = Math.cos((a * Math.PI) / 180);
    s += `<rect x="${f(wx - I.S * 0.17 * sc)}" y="${f(wy - I.S * 0.35)}" width="${f(I.S * 0.34 * sc)}" height="${f(I.S * 0.5)}" fill="%W%"/>`;
  }
  s += I.dome(x + 2, y + 2, 4.4, 1.4, '#9a8ad6');
  const [rx, ry] = I.P(x + 2, y + 2, 4.4);
  s += `<ellipse cx="${f(rx)}" cy="${f(ry)}" rx="${f(I.S * 2.2)}" ry="${f(I.S * 1.27)}" fill="none" stroke="${PAL.amber}" stroke-width="1.1" opacity=".55" stroke-dasharray="2 5"/>`;
  s += I.box(x + 1.95, y + 1.95, 5.75, 0.1, 0.1, 0.9, '#e0d6ff');
  // compass rose lying flat above the dome, needle swinging to settle
  const maj = a => { const r = (a * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r); return `M${f(sn * 1.45)} ${f(-c * 1.45)} L${f(Math.cos(r) * 0.17)} ${f(Math.sin(r) * 0.17)} L${f(-Math.cos(r) * 0.17)} ${f(-Math.sin(r) * 0.17)}Z`; };
  const mnr = a => { const r = (a * Math.PI) / 180; return `M${f(Math.sin(r) * 0.85)} ${f(-Math.cos(r) * 0.85)} L${f(Math.cos(r) * 0.11)} ${f(Math.sin(r) * 0.11)} L${f(-Math.cos(r) * 0.11)} ${f(-Math.sin(r) * 0.11)}Z`; };
  s += `<g transform="${I.mTop(x + 2, y + 2, 6.75)}"><circle r="1.12" fill="#1d1540" fill-opacity=".6" stroke="${PAL.cream}" stroke-opacity=".85" stroke-width=".05"/><circle r=".92" fill="none" stroke="${PAL.amber}" stroke-width=".03" stroke-dasharray=".06 .1"/>`
    + [45, 135, 225, 315].map(a => `<path d="${mnr(a)}" fill="#c9b8f0" opacity=".75"/>`).join('')
    + [0, 90, 180, 270].map(a => `<path d="${maj(a)}" fill="${PAL.cream}"/>`).join('')
    + `<g class="needle"><path d="M0 -1.0 L.2 0 L-.2 0Z" fill="${PAL.coral}"/><path d="M0 1.0 L.2 0 L-.2 0Z" fill="#7b6aa8"/><circle r=".09" fill="${PAL.cream}"/></g></g>`;
  return { svg: s, pin: I.P(x + 2, y + 2, 6.9) };
}

export const label = esc;
