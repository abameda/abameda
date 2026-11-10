// Postcard furniture for the featured cards: a stamp printed with the hero city as a massing model
// (this building's lot lit in coral, so every card points back to its place in the skyline), and a
// postmark dated by the repo's last push.
import { f, P as PAL, MONTHS } from './svg.mjs';
import { iso } from './iso.mjs';
import { LAYOUT } from './city.mjs';

// Footprint and height of each hero building, in world units.
const MASS = {
  attendance: [5, 4, 8.2], cortex: [4, 4, 14.5], 'cortex-ops': [3, 3, 3.6], bosla: [4, 4, 5.8],
  'mnu-sms': [3.6, 4.6, 4.6], dose: [3.6, 3.6, 6.3], thread: [3, 3, 3.8], printer: [3, 3, 3], yosr: [4, 4, 1.8],
};
const PAPER = '#f2e6d6', INK = '#ffd9c2';

export function stamp(x, y, key, num, { w = 140, h = 112, keys = null } = {}) {
  if (!LAYOUT.b[key]) return '';
  const { X, Y, river } = LAYOUT, iw = w - 18, ih = h - 18, zk = 0.45;
  const S = (iw - 12) / ((X + Y) * 0.866);
  const ox = x + 9 + 6 + Y * 0.866 * S, oy = y + 9 + 4 + 14.5 * zk * S + (ih - 8 - (X + Y) * 0.5 * S - 14.5 * zk * S - S) / 2;
  const I = iso(ox, oy, S, 'st');
  let m = I.box(0, 0, -0.9, X, Y, 0.9, '#4c2f62', { top: false }) + I.topFace(0, 0, 0, X, river, '#3d2c5c') + I.topFace(0, river, -0.2, X, Y - river, '#2f4a86');
  const lots = Object.entries(LAYOUT.b).filter(([k]) => MASS[k] && (!keys || keys.has(k))).sort((a, b) => a[1][0] + a[1][1] - (b[1][0] + b[1][1]));
  for (const [k, [bx, by]] of lots) {
    const [mw, md, mh] = MASS[k], on = k === key;
    m += I.box(bx, by, 0, mw, md, mh * zk, on ? PAL.coral : '#7d6aae', { lite: !on });
  }
  const [mx, my] = MASS[key], [px, py] = I.P(LAYOUT.b[key][0] + mx / 2, LAYOUT.b[key][1] + my / 2, MASS[key][2] * zk);
  m += `<circle cx="${f(px)}" cy="${f(py - 7)}" r="3.4" fill="${PAL.amberHot}"/><line x1="${f(px)}" y1="${f(py - 4)}" x2="${f(px)}" y2="${f(py)}" stroke="${PAL.amberHot}" stroke-width="1.2"/>`;
  const id = `perf${key.replace(/[^a-z]/g, '')}`;
  let holes = '';
  for (let u = 4; u < w; u += 9.2) holes += `<circle cx="${f(x + u)}" cy="${y}" r="3.2"/><circle cx="${f(x + u)}" cy="${y + h}" r="3.2"/>`;
  for (let v = 4; v < h; v += 9.2) holes += `<circle cx="${x}" cy="${f(y + v)}" r="3.2"/><circle cx="${x + w}" cy="${f(y + v)}" r="3.2"/>`;
  return `<mask id="${id}"><rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" fill="#fff"/><g fill="#000">${holes}</g></mask>`
    + `<g transform="rotate(-3 ${x + w / 2} ${y + h / 2})"><g mask="url(#${id})"><rect x="${x + 2}" y="${y + 4}" width="${w}" height="${h}" fill="#05020d" opacity=".35"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${PAPER}"/></g>`
    + `<rect x="${x + 9}" y="${y + 9}" width="${iw}" height="${ih}" fill="#1d1238"/>`
    + `<clipPath id="${id}c"><rect x="${x + 9}" y="${y + 9}" width="${iw}" height="${ih}"/></clipPath><g clip-path="url(#${id}c)">${m}</g>`
    + `<text x="${x + 15}" y="${y + 30}" class="d" font-size="20" fill="${PAPER}">${num}</text>`
    + `<text x="${x + w - 14}" y="${y + h - 14}" text-anchor="end" class="m" font-size="7.5" fill="${PAPER}" letter-spacing="1.2" opacity=".8">MINYA</text></g>`;
}

// Round postmark; the wavy cancel lines run toward `dir` (1 right, -1 left).
export function postmark(cx, cy, iso8601, { r = 38, dir = 1, id = 'pm' } = {}) {
  const d = new Date(iso8601), day = String(d.getUTCDate()).padStart(2, '0'), mon = MONTHS[d.getUTCMonth()], yr = d.getUTCFullYear();
  // glyphs stand outward from the top baseline and inward from the bottom one, so both sit in the band
  const top = `M${f(cx - r + 12)} ${cy} A${r - 12} ${r - 12} 0 0 1 ${f(cx + r - 12)} ${cy}`, bot = `M${f(cx - r + 5)} ${cy} A${r - 5} ${r - 5} 0 0 0 ${f(cx + r - 5)} ${cy}`;
  let waves = '';
  for (let k = -1; k <= 1; k++) {
    const y = cy + k * 9, x0 = dir > 0 ? cx + r + 4 : cx - r - 4;
    let p = `M${f(x0)} ${f(y)}`;
    for (let i = 1; i <= 8; i++) p += ` q${f(dir * 5)} ${i % 2 ? -4 : 4} ${f(dir * 10)} 0`;
    waves += `<path d="${p}" fill="none" stroke="${INK}" stroke-width="1.4"/>`;
  }
  return `<g transform="rotate(-12 ${cx} ${cy})" opacity=".78"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${INK}" stroke-width="1.6"/><circle cx="${cx}" cy="${cy}" r="${r - 15}" fill="none" stroke="${INK}" stroke-width=".9"/>`
    + `<path id="${id}t" d="${top}" fill="none"/><path id="${id}b" d="${bot}" fill="none"/>`
    + `<text class="m" font-size="7.5" fill="${INK}" letter-spacing="1.6"><textPath href="#${id}t" startOffset="50%" text-anchor="middle" letter-spacing="1">MINYA · EGYPT</textPath></text>`
    + `<text class="m" font-size="7" fill="${INK}" letter-spacing="1.4"><textPath href="#${id}b" startOffset="50%" text-anchor="middle">LAST PUSH</textPath></text>`
    + `<text x="${cx}" y="${cy + 2}" text-anchor="middle" class="d" font-size="15" fill="${INK}" letter-spacing=".5">${day} ${mon}</text>`
    + `<text x="${cx}" y="${cy + 12}" text-anchor="middle" class="m" font-size="7.5" fill="${INK}" letter-spacing="1">${yr}</text>${waves}</g>`;
}
