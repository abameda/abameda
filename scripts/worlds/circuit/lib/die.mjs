// The decapped U1: a window cut into the package shows the silicon die, its seal ring,
// standard-cell texture and macro blocks, with gold bond wires fanning out to the lead frame.
import { C, pad, r1, rng } from './svg.mjs';
import { spread } from './parts.mjs';

// Wire glow chases clockwise around the die (opacity only, so it is cheap and never strobes).
export const DIE_CSS = `.bw{opacity:0;animation:bw 8s linear infinite}
@keyframes bw{0%{opacity:0}5%{opacity:.95}18%{opacity:0}100%{opacity:0}}
.dsh{animation:dsh 11s cubic-bezier(.45,0,.2,1) infinite}
@keyframes dsh{0%,58%{transform:translateX(0) skewX(-20deg)}100%{transform:translateX(1400px) skewX(-20deg)}}`;

export function decap(cav, die, { nT = 26, nS = 7, id = 'd', k = 1, seed = 5 } = {}) {
  const u = v => r1(v / k);
  const R = rng(seed);
  let g = '', ov = '';
  // cavity floor and lead-frame fingers
  g += `<rect x="${cav.x}" y="${cav.y}" width="${cav.w}" height="${cav.h}" rx="${u(8)}" fill="#050606" stroke="#2B302D" stroke-width="${u(1.5)}"/>`;
  g += `<rect x="${cav.x + u(3)}" y="${cav.y + u(3)}" width="${cav.w - u(6)}" height="${cav.h - u(6)}" rx="${u(6)}" fill="none" stroke="#000" stroke-width="${u(3)}" opacity=".6"/>`;
  const inset = u(26);
  const fT = spread(cav.x + inset, cav.x + cav.w - inset, nT), fS = spread(cav.y + inset, cav.y + cav.h - inset, nS);
  const fl = u(15), fw = u(6);
  fT.forEach(x => (g += pad(x - fw / 2, cav.y + u(5), fw, fl, 1) + pad(x - fw / 2, cav.y + cav.h - u(5) - fl, fw, fl, 1)));
  fS.forEach(y => (g += pad(cav.x + u(5), y - fw / 2, fl, fw, 1) + pad(cav.x + cav.w - u(5) - fl, y - fw / 2, fl, fw, 1)));

  // die: thin-film tint, cell rows, macro blocks, seal ring
  const { x, y, w, h } = die;
  g += `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1E2233"/><stop offset=".38" stop-color="#1A2230"/><stop offset=".62" stop-color="#241E31"/><stop offset="1" stop-color="#16262A"/></linearGradient>`;
  g += `<radialGradient id="${id}r" cx=".3" cy=".2" r=".9"><stop offset="0" stop-color="#C9D6FF" stop-opacity=".10"/><stop offset="1" stop-color="#C9D6FF" stop-opacity="0"/></radialGradient>`;
  g += `<pattern id="${id}p" width="${u(9)}" height="${u(11)}" patternUnits="userSpaceOnUse"><path d="M0 ${u(.5)}H${u(9)}" stroke="#AFC2FF" stroke-opacity=".07" stroke-width="${u(1)}"/><path d="M${u(3)} ${u(3)}V${u(9)}M${u(6.5)} ${u(2)}V${u(7)}" stroke="#D8C9FF" stroke-opacity=".04" stroke-width="${u(1.4)}"/></pattern>`;
  g += `<rect x="${x + u(3)}" y="${y + u(4)}" width="${w}" height="${h}" rx="${u(3)}" fill="#000" opacity=".6"/>`;
  g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${u(3)}" fill="url(#${id}g)"/>`;
  g += `<rect x="${x + u(16)}" y="${y + u(16)}" width="${w - u(32)}" height="${h - u(32)}" fill="url(#${id}p)"/>`;
  // macro blocks in the four corners (SRAM-like arrays)
  const mw = u(70), mh = u(34);
  for (const [mx, my] of [[x + u(22), y + u(22)], [x + w - u(22) - mw, y + u(22)], [x + u(22), y + h - u(22) - mh], [x + w - u(22) - mw, y + h - u(22) - mh]]) {
    g += `<rect x="${r1(mx)}" y="${r1(my)}" width="${mw}" height="${mh}" fill="#0F1220" opacity=".55" stroke="#8C7BD0" stroke-opacity=".18" stroke-width="${u(1)}"/>`;
    for (let i = 1; i < 6; i++) g += `<path d="M${r1(mx + mw * i / 6)} ${r1(my + u(3))}V${r1(my + mh - u(3))}" stroke="#9AE0E6" stroke-opacity=".10" stroke-width="${u(1)}"/>`;
  }
  g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${u(3)}" fill="url(#${id}r)"/>`;
  g += `<rect x="${x + u(5)}" y="${y + u(5)}" width="${w - u(10)}" height="${h - u(10)}" rx="${u(2)}" fill="none" stroke="${C.goldLo}" stroke-opacity=".5" stroke-width="${u(1.2)}"/>`;
  g += `<rect x="${x + u(9)}" y="${y + u(9)}" width="${w - u(18)}" height="${h - u(18)}" fill="none" stroke="${C.goldLo}" stroke-opacity=".22" stroke-width="${u(1)}"/>`;

  // bond pads on the die edge + wires to the fingers, listed clockwise for the glow chase
  const pT = spread(x + u(30), x + w - u(30), nT), pS = spread(y + u(28), y + h - u(28), nS);
  const ps = u(7), pin = u(12);
  const wires = [];
  pT.forEach((px, i) => wires.push([px, y + pin, fT[i], cav.y + u(5) + fl]));
  pS.forEach((py, i) => wires.push([x + w - pin, py, cav.x + cav.w - u(5) - fl, fS[i]]));
  [...pT].reverse().forEach((px, i) => wires.push([px, y + h - pin, fT[nT - 1 - i], cav.y + cav.h - u(5) - fl]));
  [...pS].reverse().forEach((py, i) => wires.push([x + pin, py, cav.x + u(5) + fl, fS[nS - 1 - i]]));
  const N = wires.length;
  wires.forEach(([ax, ay, bx, by], i) => {
    g += pad(ax - ps / 2, ay - ps / 2, ps, ps, 1);
    const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
    const bow = u(3 + R() * 3);
    const d = `M${r1(ax)} ${r1(ay)}Q${r1(mx - dy / L * bow)} ${r1(my + dx / L * bow)} ${r1(bx)} ${r1(by)}`;
    g += `<path d="${d}" fill="none" stroke="${C.goldHi}" stroke-width="${u(1.2)}" opacity=".85"/>`;
    g += `<circle cx="${r1(ax)}" cy="${r1(ay)}" r="${u(2.2)}" fill="${C.goldHi}"/>`;
    ov += `<path class="bw" d="${d}" fill="none" stroke="${C.sig}" stroke-width="${u(2.2)}" style="animation-delay:-${(8 * (1 - i / N)).toFixed(2)}s"/>`;
  });
  // a slow light sweep across the die surface
  const sheen = `<clipPath id="${id}c"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${u(3)}"/></clipPath>
<linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#E6F4FF" stop-opacity=".09"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<g clip-path="url(#${id}c)"><rect class="dsh" x="${r1(x - w * 0.5)}" y="${r1(y - h * 0.3)}" width="${r1(w * 0.3)}" height="${r1(h * 1.6)}" fill="url(#${id}s)" transform="skewX(-20)"/></g>`;
  return { svg: g, overlay: ov + sheen };
}
