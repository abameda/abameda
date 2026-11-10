// Component footprints: QFP packages, LEDs, crystals. Pure drawing, no data.
import { C, pad, r1, silk } from './svg.mjs';

// Evenly spaced pin centres along a span.
const spread = (a, b, n) => Array.from({ length: n }, (_, i) => (n === 1 ? (a + b) / 2 : a + (b - a) * i / (n - 1)));

// Quad flat package. Returns { svg, pins: {L,R,T,B} } where each pin is { x, y } at the lead tip.
export function qfp({ x, y, w, h, n = [12, 12, 12, 12], len = 20, pw = 9, inset = 34, id = 'q', body = 'url(#pkg)', sheen = true }) {
  const [nL, nR, nT, nB] = n;
  const pins = { L: [], R: [], T: [], B: [] };
  let leads = '';
  for (const py of spread(y + inset, y + h - inset, nL)) { leads += pad(x - len, py - pw / 2, len + 3, pw, 1); pins.L.push({ x: x - len, y: py }); }
  for (const py of spread(y + inset, y + h - inset, nR)) { leads += pad(x + w - 3, py - pw / 2, len + 3, pw, 1); pins.R.push({ x: x + w + len, y: py }); }
  for (const px of spread(x + inset, x + w - inset, nT)) { leads += pad(px - pw / 2, y - len, pw, len + 3, 1); pins.T.push({ x: px, y: y - len }); }
  for (const px of spread(x + inset, x + w - inset, nB)) { leads += pad(px - pw / 2, y + h - 3, pw, len + 3, 1); pins.B.push({ x: px, y: y + h + len }); }
  const rx = Math.min(12, w * 0.04);
  const shine = sheen
    ? `<clipPath id="${id}c"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/></clipPath>
<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<g clip-path="url(#${id}c)"><rect class="sheen" x="${x - w * 0.6}" y="${y - h * 0.2}" width="${w * 0.45}" height="${h * 1.4}" fill="url(#${id}s)" transform="skewX(-18)"/></g>`
    : '';
  const svg = `${leads}
<rect x="${x + 3}" y="${y + 5}" width="${w}" height="${h}" rx="${rx}" fill="#000" opacity=".55"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${body}" stroke="${C.pkgEdge}" stroke-width="1.5"/>
<rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="${Math.max(2, rx - 5)}" fill="none" stroke="#fff" stroke-opacity=".035" stroke-width="1"/>
<circle cx="${x + 26}" cy="${y + 26}" r="${Math.max(4, Math.min(8, w * 0.018))}" fill="#090A0A" stroke="#262B28"/>${shine}`;
  return { svg, pins };
}

// Sheen keyframes for the moving highlight on package tops (long rest so it is a glint, not a strobe).
export const SHEEN_CSS = `.sheen{animation:sheen 9s cubic-bezier(.45,0,.2,1) infinite}
@keyframes sheen{0%,62%{transform:translateX(0) skewX(-18deg)}100%{transform:translateX(1500px) skewX(-18deg)}}`;

// 0603 LED that glows in the signal colour. `cls` lets callers attach a heartbeat animation.
export function led(x, y, { ref = 'D1', cls = 'blink', label = true } = {}) {
  return `<g><radialGradient id="ledg${x}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${C.sig}" stop-opacity=".55"/><stop offset=".35" stop-color="${C.sig}" stop-opacity=".18"/><stop offset="1" stop-color="${C.sig}" stop-opacity="0"/></radialGradient>
${pad(x - 12, y - 5, 5, 10, 1)}${pad(x + 7, y - 5, 5, 10, 1)}
<rect x="${x - 7}" y="${y - 5}" width="14" height="10" fill="#0E2A30"/>
<circle cx="${x}" cy="${y}" r="22" fill="url(#ledg${x})" class="${cls}"/>
<rect x="${x - 5}" y="${y - 3}" width="10" height="6" rx="1" fill="#C9F7FF" class="${cls}"/>
${label ? silk(x - 12, y - 13, ref, { size: 10 }) : ''}</g>`;
}

// SOIC / TSSOP: leads on the long top and bottom edges of a wide body.
export function soic({ x, y, w, h, n = 8, len = 14, pw = 8, inset = 22, body = 'url(#pkg)' }) {
  const pins = { T: [], B: [] }; let leads = '';
  for (const px of spread(x + inset, x + w - inset, n)) {
    leads += pad(px - pw / 2, y - len, pw, len + 3, 1) + pad(px - pw / 2, y + h - 3, pw, len + 3, 1);
    pins.T.push({ x: px, y: y - len }); pins.B.push({ x: px, y: y + h + len });
  }
  const svg = `${leads}<rect x="${x + 3}" y="${y + 4}" width="${w}" height="${h}" rx="4" fill="#000" opacity=".5"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${body}" stroke="${C.pkgEdge}" stroke-width="1.2"/>
<path d="M${x} ${y + h / 2 - 7}A7 7 0 0 1 ${x} ${y + h / 2 + 7}" fill="#070808" stroke="#262B28"/>`;
  return { svg, pins };
}

// Gold-plated RF shield can over a castellated module (used for the most "precious" part).
export function shield({ x, y, w, h, id = 'sh', n = 9 }) {
  let cast = '';
  for (const px of spread(x + 28, x + w - 28, n)) cast += pad(px - 6, y + h - 2, 12, 10, 1.5) + pad(px - 6, y - 8, 12, 10, 1.5);
  for (const py of spread(y + 28, y + h - 28, Math.max(3, Math.round(n * h / w)))) cast += pad(x - 8, py - 6, 10, 12, 1.5) + pad(x + w - 2, py - 6, 10, 12, 1.5);
  const brushed = `<pattern id="${id}b" width="6" height="${h}" patternUnits="userSpaceOnUse"><rect width="6" height="${h}" fill="none"/><path d="M1 0V${h}M4 0V${h}" stroke="#fff" stroke-opacity=".05"/></pattern>`;
  const svg = `${brushed}${cast}
<rect x="${x + 4}" y="${y + 6}" width="${w}" height="${h}" rx="8" fill="#000" opacity=".55"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="url(#au)"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="url(#${id}b)"/>
<rect x="${x + 10}" y="${y + 10}" width="${w - 20}" height="${h - 20}" rx="5" fill="none" stroke="#5B4416" stroke-opacity=".45" stroke-width="1.5"/>
<rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h * 0.45}" rx="6" fill="#fff" opacity=".07"/>`;
  return { svg };
}

// HC-49 style crystal can.
export function crystal(x, y, w = 64, h = 24) {
  return `<g>${pad(x - 8, y + h / 2 - 5, 10, 10, 1)}${pad(x + w - 2, y + h / 2 - 5, 10, 10, 1)}
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="url(#auH)" opacity=".9"/>
<rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="${(h - 8) / 2}" fill="none" stroke="#5a4518" stroke-opacity=".5"/></g>`;
}

// Silkscreen courtyard corner brackets around a footprint.
export function courtyard(x, y, w, h, k = 14) {
  const p = (d) => `<path d="${d}" fill="none" stroke="${C.silk2}" stroke-width="1.4" opacity=".55"/>`;
  return p(`M${x} ${y + k}V${y}H${x + k}`) + p(`M${x + w - k} ${y}H${x + w}V${y + k}`) +
    p(`M${x} ${y + h - k}V${y + h}H${x + k}`) + p(`M${x + w - k} ${y + h}H${x + w}V${y + h - k}`);
}

export { spread, r1 };
