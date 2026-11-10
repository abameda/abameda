// Enamel street plates in the Egyptian style: blue enamel, white rim, Arabic above English.
// They name the four parts of the city inside the artwork itself (design copy, see NOTES.md),
// so no section needs a separate header image. SVGs that use a plate embed the Arabic subset font.
import { f, esc, TL } from './svg.mjs';
import { displayWidth } from './metrics.mjs';

export const STREETS = {
  landmark: { ar: 'شارع المعالم', en: 'LANDMARK AVENUE' },
  market: { ar: 'شارع السوق', en: 'MARKET STREET' },
  census: { ar: 'ميدان التعداد', en: 'CENSUS SQUARE' },
  station: { ar: 'المحطة المركزية', en: 'CENTRAL STATION' },
};
export const ENAMEL = '#1f4c9a', RIM = '#f4f1ea';

// Top-centre at (cx, y). en/ar are the type sizes. Returns { svg, w, h }.
export function plate(cx, y, key, { en = 26, ar = 24, minW = 0, pad = 22, shadow = true } = {}) {
  const s = STREETS[key];
  const enW = displayWidth(s.en, en, 2), arW = [...s.ar].length * ar * 0.44;
  const w = Math.max(minW, enW + 2 * pad, arW + 2 * pad);
  const arBase = 10 + ar * 0.98, rule = arBase + ar * 0.44, enBase = rule + 8 + en * 0.74, h = enBase + 13;
  let g = `<g transform="translate(${f(cx - w / 2)},${f(y)})">`;
  if (shadow) g += `<rect x="3" y="5" width="${f(w)}" height="${f(h)}" rx="9" fill="#05020d" opacity=".5"/>`;
  g += `<rect width="${f(w)}" height="${f(h)}" rx="9" fill="${ENAMEL}"/>`
    + `<rect x="5" y="5" width="${f(w - 10)}" height="${f(h - 10)}" rx="6" fill="none" stroke="${RIM}" stroke-width="2.2"/>`
    + `<path d="M7 ${f(h * 0.42)} Q${f(w / 2)} ${f(h * 0.3)} ${f(w - 7)} ${f(h * 0.42)} V7 H7Z" fill="#fff" opacity=".07"/>`;
  g += `<text x="${f(w / 2)}" y="${f(arBase)}" text-anchor="middle" class="a" font-size="${ar}" fill="${RIM}">${esc(s.ar)}</text>`;
  g += `<line x1="${pad}" y1="${f(rule)}" x2="${f(w - pad)}" y2="${f(rule)}" stroke="${RIM}" stroke-opacity=".45" stroke-width="1"/>`;
  g += `<text x="${f(w / 2)}" y="${f(enBase)}" text-anchor="middle" class="d" font-size="${en}" fill="${RIM}" letter-spacing="2" ${TL(s.en, en, 2)}>${esc(s.en)}</text>`;
  for (const [sx, sy] of [[11, 11], [w - 11, 11], [11, h - 11], [w - 11, h - 11]]) g += `<circle cx="${f(sx)}" cy="${f(sy)}" r="1.7" fill="#c9d3e8"/>`;
  return { svg: g + '</g>', w, h };
}

// A plate bolted to a slim post that stands on the ground at (gx, gy).
export function postPlate(gx, gy, key, { height = 120, ...opt } = {}) {
  const p = plate(gx, gy - height, key, opt);
  const post = `<rect x="${f(gx - 2.5)}" y="${f(gy - height + p.h - 4)}" width="5" height="${f(height - p.h + 4)}" fill="#2a2148"/><rect x="${f(gx - 2.5)}" y="${f(gy - height + p.h - 4)}" width="1.6" height="${f(height - p.h + 4)}" fill="#5a4c86"/>`
    + `<ellipse cx="${f(gx)}" cy="${f(gy)}" rx="9" ry="3.5" fill="#05020d" opacity=".45"/>`;
  return { svg: post + p.svg, w: p.w, h: p.h };
}
