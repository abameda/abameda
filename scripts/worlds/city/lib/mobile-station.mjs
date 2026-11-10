// Phone Central Station. The README keeps the strip's five img widths, so on a phone each piece is
// a narrow column: the desktop viaduct, pillars, hall front, canopy, train and tunnels are drawn at
// half scale (same global pillar rhythm, so the line still runs unbroken across the five images),
// and above the line each stop carries only what reads at that width: its number, its name and
// its action, in the display face (one embedded font; the hall adds the Arabic subset for its plate).
import { svgDoc, f, esc, P as PAL, TL } from './svg.mjs';
import { displayWidth } from './metrics.mjs';
import { MOTION } from './motion.mjs';
import { STREETS, ENAMEL, RIM } from './plate.mjs';
import { stationMeta, pieceW, pieceX, frame, line, portal, train, canopy, hallFront, LINE, DECK } from './contact.mjs';
import { fitSize } from './scene.mjs';

const K = 0.5, G = 6, T = 80, HM = 228; // desktop-to-phone scale, end gutter, strip offset, piece height
const dt = (x, y, text, size, fill, { ls = 1, anchor = 'start' } = {}) =>
  `<text x="${f(x)}" y="${f(y)}" class="d" font-size="${f(size)}" fill="${fill}" letter-spacing="${ls}" text-anchor="${anchor}" ${TL(text, size, ls)}>${esc(text)}</text>`;

// An upright enamel plate: Arabic words stacked over English words, same enamel, rim and rivets.
function platePortrait(cx, y, key, { w = 84, ar = 16, en = 18 } = {}) {
  const s = STREETS[key], ars = s.ar.split(' '), ens = s.en.split(' ');
  let yy = 12, txt = '';
  ars.forEach(a => { yy += ar * 1.1; txt += `<text x="${f(w / 2)}" y="${f(yy)}" text-anchor="middle" class="a" font-size="${ar}" fill="${RIM}">${esc(a)}</text>`; });
  const rule = yy + 9;
  yy = rule + 4;
  ens.forEach(e => { yy += en * 0.98; const sz = Math.min(en, fitSize(e, w - 16, en, 1)); txt += dt(w / 2, yy, e, sz, RIM, { anchor: 'middle' }); yy += 3; });
  const h = yy + 10;
  let g = `<g transform="translate(${f(cx - w / 2)},${f(y)})"><rect x="2" y="4" width="${w}" height="${f(h)}" rx="8" fill="#05020d" opacity=".5"/><rect width="${w}" height="${f(h)}" rx="8" fill="${ENAMEL}"/>`
    + `<rect x="4.5" y="4.5" width="${w - 9}" height="${f(h - 9)}" rx="5" fill="none" stroke="${RIM}" stroke-width="2"/>`
    + `<path d="M6 ${f(h * 0.3)} Q${f(w / 2)} ${f(h * 0.2)} ${w - 6} ${f(h * 0.3)} V6 H6Z" fill="#fff" opacity=".07"/>`
    + `<line x1="12" y1="${f(rule)}" x2="${w - 12}" y2="${f(rule)}" stroke="${RIM}" stroke-opacity=".45"/>` + txt;
  for (const [sx, sy] of [[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]]) g += `<circle cx="${f(sx)}" cy="${f(sy)}" r="1.5" fill="#c9d3e8"/>`;
  return { svg: g + '</g>', h };
}

// One piece: dusk background clipped to the strip's outline (rounded only at the two ends, inset by
// one gutter so the strip's outer edges line up with the phone cards above it).
function pieceM(i, n, art, text, { title, desc, arabic = false, css = '' }) {
  const w = pieceW(i, n) * K, first = i === 0, last = i === n, x0 = first ? G : 0, vw = w - (first || last ? G : 0);
  const fr = frame(vw, first, last, HM);
  const defs = `<clipPath id="cps"><path transform="translate(${x0},0)" d="${fr.clip}"/></clipPath>
<linearGradient id="bgs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#160d33"/><stop offset=".65" stop-color="#2a1550"/><stop offset="1" stop-color="#4a2160"/></linearGradient>
<linearGradient id="cliffS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a4a7c"/><stop offset=".35" stop-color="#5e2c66"/><stop offset="1" stop-color="#24133f"/></linearGradient>
<radialGradient id="lampS"><stop offset="0" stop-color="#ffd58a" stop-opacity=".8"/><stop offset="1" stop-color="#ffd58a" stop-opacity="0"/></radialGradient>`;
  const body = `<g clip-path="url(#cps)"><rect width="${w}" height="${HM}" fill="url(#bgs)"/>`
    + `<g transform="translate(0,${T}) scale(${K})">${art}</g>${text}</g>`
    + `<path transform="translate(${x0},0)" d="${fr.edge}" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="1.5"/>`
    + (first ? '' : `<line x1=".5" y1="12" x2=".5" y2="${T + (DECK - 40) * K}" stroke="#fff" stroke-opacity=".07"/>`);
  return svgDoc({ w, h: HM, title, desc, css: MOTION + css, defs, body, fonts: { mono: false, arabic }, gutter: [first ? G : 0, last ? G : 0] });
}

export function hallM(n) {
  const pl = platePortrait(G + 47, 12, 'station');
  const art = hallFront(200, (pl.h + 18 - T) / K) + line(0, 200) + portal(0, -1);
  return pieceM(0, n, art, pl.svg, { title: 'Central Station', desc: 'The station hall: four stops out of the city, one for each way to reach him.', arabic: true });
}

// All stop names share one size, so the strip reads as one line of signs.
export const stopNameSize = links => Math.min(36, ...links.map(([k, u]) => fitSize(stationMeta(k, u).name, 125 - 22, 36, 1)));

export function stationM(key, url, idx, n, nameSize) {
  const i = idx + 1, wd = pieceW(i, n), w = wd * K, m = stationMeta(key, url), last = i === n, vw = last ? w - G : w, cx = vw / 2;
  const stop = `STOP ${String(i).padStart(2, '0')}`, sw = displayWidth(stop, 17, 1.4) + 14;
  let text = `<circle cx="${f(cx - sw / 2 + 4)}" cy="22" r="4.5" fill="${LINE}"/>` + dt(cx - sw / 2 + 14, 29, stop, 17, PAL.mute, { ls: 1.4 });
  text += dt(cx, 84, m.name, nameSize, PAL.cream, { anchor: 'middle' });
  const cs = Math.min(17, fitSize(m.cta, vw - 54, 17, 1)), bw = displayWidth(m.cta, cs, 1) + 46, bx = cx - bw / 2;
  text += `<g transform="translate(${f(bx)},104)"><rect width="${f(bw)}" height="30" rx="15" fill="#1a1036" stroke="${LINE}" stroke-width="1.6"/>`
    + dt(14, 21, m.cta, cs, PAL.cream) + `<path d="M${f(bw - 24)} 20 l8 -8 M${f(bw - 22)} 12 h6 v6" stroke="${LINE}" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>`;
  const cxd = vw / K / 2, art = canopy(cxd) + line(pieceX(i, n), wd) + (last ? train(cxd - 4) + portal(wd, 1) : '');
  const css = last ? `.train{animation:shuttle 14s cubic-bezier(.55,0,.35,1) infinite}@keyframes shuttle{0%,30%{transform:translateX(0)}52%,64%{transform:translateX(${f(wd / 2 + 80)}px)}86%,100%{transform:translateX(0)}}` : '';
  return pieceM(i, n, art, text, { title: `${m.name}: ${m.sub}`, desc: `Stop ${i} on the line out of the city: ${m.name}, ${m.sub}.`, css });
}
