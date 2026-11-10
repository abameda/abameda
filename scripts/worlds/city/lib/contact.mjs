// Central Station: a raised metro line runs out of a tunnel in the Minya cliffs, through the station
// hall and four linked stops, and back into the cliffs at the terminus. Each piece is its own linked
// SVG; laid edge to edge in the README they form one continuous strip, so the viaduct, the pillar
// rhythm and the ground strata line up across the seams.
import { svgDoc, f, esc, P as PAL, tag, TL, monoW, stars, GUTTER } from './svg.mjs';
import { displayWidth } from './metrics.mjs';
import { MOTION } from './motion.mjs';
import { plate } from './plate.mjs';

export const LINE = '#ff7a6b', Ht = 292, HALL = 200, TOTAL = 1200;
export const DECK = 168, GROUND = 264; // top of the track bed, street level

export function stationMeta(key, url) {
  const u = new URL(url), host = u.hostname.replace(/^www\./, ''), path = u.pathname.replace(/\/$/, '');
  if (key === 'linkedin') return { name: 'LINKEDIN', sub: path.replace('/in/', 'in/') || host, cta: 'CONNECT' };
  if (key === 'github') return { name: 'GITHUB', sub: '@' + path.split('/').filter(Boolean)[0], cta: 'FOLLOW' };
  if (key === 'cv' || /\.pdf$/i.test(path)) return { name: 'CV', sub: 'résumé · pdf', cta: 'DOWNLOAD' };
  if (key === 'website') return { name: 'WEBSITE', sub: host, cta: 'VISIT' };
  return { name: key.toUpperCase(), sub: host, cta: 'OPEN' };
}

// piece 0 is the hall, pieces 1..n are the stops
const stopW = n => (TOTAL - HALL) / n;
export const pieceW = (i, n) => (i === 0 ? HALL : stopW(n));
export const pieceX = (i, n) => (i === 0 ? 0 : HALL + (i - 1) * stopW(n));
const pct = (i, n) => `${((pieceW(i, n) + (i === 0 || i === n ? GUTTER : 0)) / (TOTAL + 2 * GUTTER) * 100 - 0.02).toFixed(2)}%`;
export const hallWidth = n => pct(0, n);
export const stationWidth = (i, n) => pct(i + 1, n);

export function frame(w, first, last, Ht = 292) {
  const r = 24, L = first ? r : 0, R = last ? r : 0;
  const d = `M${L} 0 H${w - R}${R ? ` A${r} ${r} 0 0 1 ${w} ${r} V${Ht - r} A${r} ${r} 0 0 1 ${w - r} ${Ht}` : ` V${Ht}`} H${L}${L ? ` A${r} ${r} 0 0 1 0 ${Ht - r} V${r} A${r} ${r} 0 0 1 ${r} 0` : ` V0`}Z`;
  const edge = `M${first ? L : 0} .75 H${w - R}${R ? ` A${r - 0.75} ${r - 0.75} 0 0 1 ${w - 0.75} ${r} V${Ht - r} A${r - 0.75} ${r - 0.75} 0 0 1 ${w - R} ${Ht - 0.75}` : ''} M${w - R} ${Ht - 0.75} H${L}${L ? ` A${r - 0.75} ${r - 0.75} 0 0 1 .75 ${Ht - r} V${r} A${r - 0.75} ${r - 0.75} 0 0 1 ${L} .75` : ''}`;
  return { clip: d, edge };
}

// world pieces shared by every slice: ground strata, pillars (on a global rhythm), the viaduct
export function line(gx, w) {
  let s = '';
  [[GROUND, 6, '#43305f'], [GROUND + 6, 10, '#4c2f62'], [GROUND + 16, 8, '#36234f'], [GROUND + 24, 6, '#24173a']].forEach(([y, h, c]) => { s += `<rect x="0" y="${y}" width="${w}" height="${h}" fill="${c}"/>`; });
  for (let px = 75 - (gx % 150); px < w + 20; px += 150) {
    if (px < -20) continue;
    s += `<rect x="${f(px - 8)}" y="${DECK + 22}" width="8" height="${GROUND - DECK - 22}" fill="#2c2050"/><rect x="${f(px)}" y="${DECK + 22}" width="8" height="${GROUND - DECK - 22}" fill="#4a3870"/>`
      + `<rect x="${f(px - 11)}" y="${DECK + 22}" width="22" height="5" fill="#5a4a8a"/><ellipse cx="${f(px - 4)}" cy="${GROUND + 1}" rx="16" ry="3" fill="#05020d" opacity=".4"/>`;
  }
  s += `<rect x="0" y="${DECK}" width="${w}" height="7" fill="#6a58a0"/><rect x="0" y="${DECK + 7}" width="${w}" height="15" fill="#3a2c63"/><rect x="0" y="${DECK + 13}" width="${w}" height="3" fill="${LINE}"/>`;
  for (let tx = 4 - (gx % 9); tx < w; tx += 9) s += `<rect x="${f(tx)}" y="${DECK + 1}" width="3" height="5" fill="#2a1d44" opacity=".55"/>`;
  s += `<line x1="0" y1="${DECK + 1.6}" x2="${w}" y2="${DECK + 1.6}" stroke="#e8e0ff" stroke-opacity=".55" stroke-width="1"/><line x1="0" y1="${DECK + 5}" x2="${w}" y2="${DECK + 5}" stroke="#e8e0ff" stroke-opacity=".55" stroke-width="1"/>`;
  return s;
}

// a tunnel portal cut into a flat-topped limestone cliff, facing `dir` (1 = line runs right into it)
export function portal(x, dir) {
  const w = 54, x0 = dir > 0 ? x - w : x, ax = dir > 0 ? x0 + 8 : x0 + 6;
  return `<path d="M${x0} ${GROUND} V${DECK - 64} l${dir > 0 ? 10 : 6} -8 h${w - 16} l${dir > 0 ? 6 : 10} 8 V${GROUND}Z" fill="url(#cliffS)"/>`
    + `<path d="M${ax} ${DECK + 22} V${DECK - 14} a20 20 0 0 1 40 0 V${DECK + 22}Z" fill="#0a0618"/>`
    + `<path d="M${ax - 3} ${DECK - 14} a23 23 0 0 1 46 0" fill="none" stroke="#c48aa0" stroke-opacity=".5" stroke-width="2"/>`;
}

export function train(cx) {
  const car = x => `<rect x="${x}" y="${DECK - 21}" width="58" height="20" rx="5" fill="#f3e6d4"/><rect x="${x}" y="${DECK - 21}" width="58" height="5" rx="2.5" fill="#d9cbb8"/>`
    + `<rect x="${x}" y="${DECK - 8}" width="58" height="3" fill="${LINE}"/>` + [6, 19, 32, 45].map(u => `<rect x="${x + u}" y="${DECK - 15}" width="8" height="5" rx="1" fill="#ffc463"/>`).join('');
  return `<g class="train">${car(cx - 60)}${car(cx + 2)}<path d="M${cx + 56} ${DECK - 21} q10 2 10 14 v5 h-10z" fill="#f3e6d4"/><circle cx="${cx + 63}" cy="${DECK - 6}" r="2" fill="#fff4c8"/></g>`;
}

export function canopy(cx) {
  return `<rect x="${cx - 52}" y="${DECK - 30}" width="3" height="30" fill="#8a7ab8"/><rect x="${cx + 49}" y="${DECK - 30}" width="3" height="30" fill="#8a7ab8"/>`
    + `<path d="M${cx - 64} ${DECK - 34} H${cx + 64} l-6 6 H${cx - 58}Z" fill="#e9dccd"/><rect x="${cx - 58}" y="${DECK - 28}" width="116" height="3" fill="#b7a6d8"/>`
    + `<circle cx="${cx - 26}" cy="${DECK - 24}" r="9" fill="url(#lampS)"/><circle cx="${cx + 26}" cy="${DECK - 24}" r="9" fill="url(#lampS)"/>`;
}

function piece(i, n, inner, { title, desc, fonts, extraCss = '' }) {
  const w = pieceW(i, n), gx = pieceX(i, n), first = i === 0, last = i === n;
  const fr = frame(w, first, last);
  const defs = `<clipPath id="cps"><path d="${fr.clip}"/></clipPath>
<linearGradient id="bgs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#160d33"/><stop offset=".65" stop-color="#2a1550"/><stop offset="1" stop-color="#4a2160"/></linearGradient>
<linearGradient id="cliffS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a4a7c"/><stop offset=".35" stop-color="#5e2c66"/><stop offset="1" stop-color="#24133f"/></linearGradient>
<radialGradient id="lampS"><stop offset="0" stop-color="#ffd58a" stop-opacity=".8"/><stop offset="1" stop-color="#ffd58a" stop-opacity="0"/></radialGradient>`;
  const body = `<g clip-path="url(#cps)"><rect width="${w}" height="${Ht}" fill="url(#bgs)"/>${stars(w, Ht, 10, 'st' + i, { maxY: 120 })}${inner(line(gx, w))}</g>`
    + `<path d="${fr.edge}" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="1.5"/>`
    + (first ? '' : `<line x1=".5" y1="18" x2=".5" y2="${DECK - 40}" stroke="#fff" stroke-opacity=".07"/>`);
  return svgDoc({ w, h: Ht, title, desc, css: MOTION + extraCss, defs, body, fonts, gutter: [first ? GUTTER : 0, last ? GUTTER : 0] });
}

// The hall: a limestone front with tall lit arches above the line and the entrance below it.
export function hallFront(w, top) {
  let s = `<rect x="52" y="${top}" width="${w - 52}" height="${GROUND - top}" fill="#7a5872"/><rect x="52" y="${top}" width="${w - 52}" height="7" fill="#a57d92"/><rect x="52" y="${top + 7}" width="${w - 52}" height="3" fill="#5a3f5e"/>`;
  for (let k = 0; k < 4; k++) s += `<path d="M${66 + k * 32} ${DECK - 10} v-${DECK - top - 46} a8 8 0 0 1 16 0 v${DECK - top - 46}z" fill="#ffc463" opacity="${k % 2 ? 0.75 : 0.95}"/>`;
  for (let k = 0; k < 3; k++) s += `<path d="M${68 + k * 34} ${GROUND - 4} v-40 a11 11 0 0 1 22 0 v36z" fill="#ffd58a" opacity="${k === 1 ? 0.95 : 0.7}"/>`;
  return s;
}

export function hall(n) {
  const w = HALL, cx = w / 2 + 14;
  const pl = plate(cx, 20, 'station', { en: 19, ar: 17, pad: 14 });
  const inner = track => {
    return hallFront(w, pl.h + 14) + track + portal(0, -1) + pl.svg;
  };
  return piece(0, n, inner, { title: 'Central Station', desc: 'The station hall: four stops out of the city, one for each way to reach him.', fonts: { arabic: true } });
}

export function station(key, url, idx, n) {
  const i = idx + 1, w = pieceW(i, n), m = stationMeta(key, url), cx = w / 2, last = i === n;
  const size = Math.min(46, (46 * (w - 44)) / displayWidth(m.name, 46, 1.5));
  const inner = track => {
    let s = tag(18, 34, `STOP ${String(i).padStart(2, '0')}`, { size: 11, fill: PAL.mute, ls: 2.2 });
    s += `<circle cx="${w - 28}" cy="30" r="11" fill="${LINE}"/><text x="${w - 28}" y="35" text-anchor="middle" class="d" font-size="15" fill="#1a1036">A</text>`;
    s += `<text x="${cx}" y="88" text-anchor="middle" class="d" font-size="${f(size)}" fill="${PAL.cream}" letter-spacing="1.5" ${TL(m.name, size, 1.5)}>${esc(m.name)}</text>`;
    s += tag(cx, 110, m.sub, { size: 12.5, fill: PAL.lav, ls: 0.4, anchor: 'middle' });
    s += canopy(cx) + track + (last ? train(cx - 4) + portal(w, 1) : '');
    const bw = monoW(m.cta, 12.5, 1.8) + 54;
    s += `<g transform="translate(${f(cx - bw / 2)},${GROUND - 46})"><rect width="${f(bw)}" height="30" rx="15" fill="#1a1036" stroke="${LINE}" stroke-width="1.6"/>`
      + `<text x="16" y="19.5" class="m" font-size="12.5" fill="${PAL.cream}" letter-spacing="1.8">${m.cta}</text>`
      + `<path d="M${f(bw - 26)} 20 l8 -8 M${f(bw - 24)} 12 h6 v6" stroke="${LINE}" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>`;
    return s;
  };
  // the terminus train waits at the platform, backs into the cliff tunnel, and returns
  const css = last ? `.train{animation:shuttle 14s cubic-bezier(.55,0,.35,1) infinite}@keyframes shuttle{0%,30%{transform:translateX(0)}52%,64%{transform:translateX(${f(w / 2 + 80)}px)}86%,100%{transform:translateX(0)}}` : '';
  return piece(i, n, inner, { title: `${m.name}: ${m.sub}`, desc: `Stop ${i} on the line out of the city: ${m.name}, ${m.sub}.`, extraCss: css });
}
