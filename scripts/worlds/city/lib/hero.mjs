// Hero: the whole city at dusk, his name on the sky. Live: lit windows = contributions in the
// last 30 days, the moon is the real phase on the refresh date, the HQ clock shows refresh time.
import { svgDoc, f, esc, P as PAL, stars, moonPhase, moonPath, moonName, fmtDate, tag, rng, TL, monoW, monoFit, newestWork, ellipsize } from './svg.mjs';
import { iso } from './iso.mjs';
import { lightUp } from './buildings-a.mjs';
import { drawCity, pinLabels } from './city.mjs';
import { MOTION } from './motion.mjs';

export const W = 1200, H = 660;

export function cairoTime(iso8601) {
  const d = new Date(iso8601), m = d.getUTCMonth(); // Egypt: UTC+3 in summer time (May-Oct), else UTC+2
  const off = m >= 4 && m <= 9 ? 3 : 2, t = new Date(d.getTime() + off * 3600000);
  return { hh: t.getUTCHours(), mm: t.getUTCMinutes() };
}

export function plateau() {
  // Minya's flat-topped limestone cliffs on the far bank, as a silhouette on the horizon.
  const r = rng('plateau'); let d = `M0 ${H}`, x = 0, y = 492;
  d += ` L0 ${y}`;
  while (x < W) { x += 40 + r() * 90; d += ` L${f(x)} ${f(y)}`; const ny = 478 + r() * 26; d += ` L${f(x + 8 + r() * 10)} ${f(ny)}`; x += 18; y = ny; }
  return `<path d="${d} L${W} ${H}Z" fill="url(#cliff)"/>`;
}

function plane() {
  const body = `<path d="M-26 0 C-20 -4 14 -5 22 -2 C26 -1 26 2 22 3 L-24 4 Z" fill="#fff4e6"/>`
    + `<path d="M-2 -1 L-12 -14 L-6 -14 L8 -1Z" fill="#e9dccd"/><path d="M-22 -1 L-28 -11 L-23 -11 L-15 -1Z" fill="${PAL.coral}"/>`
    + `<path d="M-2 3 L-10 10 L-5 10 L6 3Z" fill="#d8c9bb"/><circle cx="-27" cy="-10" r="1.6" fill="#ff5d6c" class="blink"/>`;
  const trail = `<rect x="-250" y="-1" width="220" height="2" rx="1" fill="url(#trail)"/>`;
  return `<style>@keyframes fly{from{transform:translate(-120px,118px)}to{transform:translate(${W + 120}px,10px)}}.plane{animation:fly 34s linear infinite;animation-delay:-14s}</style>`
    + `<g class="plane" transform="translate(473,74)"><g transform="rotate(-4.6)">${trail}${body}</g></g>`;
}

// Sky, sun, cliff, water, glow and name gradients, shared with the phone hero.
export const HERO_GRADS = `<radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe0a3"/><stop offset=".55" stop-color="#ffab76"/><stop offset="1" stop-color="#ff7a6b"/></radialGradient>
<radialGradient id="sunGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb07a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb07a" stop-opacity="0"/></radialGradient>
<linearGradient id="cliff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c3a6c"/><stop offset=".25" stop-color="#4e2457"/><stop offset="1" stop-color="#1c1036"/></linearGradient>
<linearGradient id="water" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d3f7d"/><stop offset=".6" stop-color="#3a3f88"/><stop offset="1" stop-color="#6a4d8f"/></linearGradient>
<radialGradient id="beaconGlow"><stop offset="0" stop-color="#bff8ff" stop-opacity=".9"/><stop offset="1" stop-color="#6fe3e1" stop-opacity="0"/></radialGradient>
<linearGradient id="beamGrad"><stop offset="0" stop-color="#d6fbff" stop-opacity=".55"/><stop offset="1" stop-color="#6fe3e1" stop-opacity="0"/></linearGradient>
<radialGradient id="lampGlow"><stop offset="0" stop-color="#ffd58a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd58a" stop-opacity="0"/></radialGradient>
<radialGradient id="moonGlow"><stop offset="0" stop-color="#fff1df" stop-opacity=".35"/><stop offset="1" stop-color="#fff1df" stop-opacity="0"/></radialGradient>
<linearGradient id="trail"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".45"/></linearGradient>
<linearGradient id="nameGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff8a74"/><stop offset="1" stop-color="#ffc58f"/></linearGradient>
<radialGradient id="slabShadow"><stop offset="0" stop-color="#12091f" stop-opacity=".55"/><stop offset="1" stop-color="#12091f" stop-opacity="0"/></radialGradient>`;

export function hero(data, profile) {
  const I = iso(800, 252, 17.5, 'h');
  const clock = cairoTime(data.generatedAt);
  const city = drawCity(I, { clock, keys: new Set(profile.projects.map(p => p.key)) });
  const c30 = data.totals.contributionsLast30Days;
  const lit = lightUp(city.svg, c30, 'hero');
  // flag offsets from each roof anchor, chosen so no two labels touch
  const flags = { cortex: [-34, -30], attendance: [-30, -28], dose: [-8, -36], bosla: [0, -34], 'mnu-sms': [-14, -30], thread: [4, -34], printer: [0, -32], yosr: [10, -30], 'cortex-ops': [0, -34] };
  const pins = pinLabels(city.pins, profile.projects, { flags });
  const phase = moonPhase(data.generatedAt), since = new Date(data.user.createdAt).getUTCFullYear();
  const mx = 1110, my = 70;

  const defs = `
<clipPath id="frame"><rect width="${W}" height="${H}" rx="26"/></clipPath>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120a2e"/><stop offset=".3" stop-color="#26144f"/><stop offset=".55" stop-color="#55286f"/><stop offset=".74" stop-color="#a5446c"/><stop offset=".86" stop-color="#ec7266"/><stop offset="1" stop-color="#ffb47c"/></linearGradient>
${HERO_GRADS}
${I.defs}`;

  const sky = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`
    + stars(W, 300, 90, 'sky', { maxY: 300 })
    + `<circle cx="${mx}" cy="${my}" r="44" fill="url(#moonGlow)" opacity="${f(0.25 + 0.75 * Math.sin(phase * Math.PI))}"/><circle cx="${mx}" cy="${my}" r="15" fill="#fff1df" opacity=".12"/>`
    + `<path d="${moonPath(mx, my, 15, phase)}" fill="#fff1df"/>`
    + tag(mx - 26, my + 4, moonName(phase), { size: 11, fill: '#cdb8ec', ls: 2, anchor: 'end' })
    + `<circle cx="1010" cy="520" r="260" fill="url(#sunGlow)"/><circle cx="1010" cy="520" r="118" fill="url(#sun)"/>`
    + plateau()
    + `<ellipse cx="900" cy="560" rx="330" ry="46" fill="url(#slabShadow)"/>`;

  const left = 64, colW = 500;
  // education from profile.json: one line if it fits the text column, else split at the first comma
  const edu = profile.education.toUpperCase(), eduLines = monoW(edu, 14, 1.6) <= colW || !edu.includes(',') ? [edu] : [edu.slice(0, edu.indexOf(',')), edu.slice(edu.indexOf(',') + 1).trim()];
  const eduTags = eduLines.map((l, i) => { const sz = monoFit(l, colW, 14, 1.6); return tag(left, 458 + i * 22, l, { size: f(sz), fill: '#e8dcff', ls: 1.6 }); }).join('');
  const text = `
${tag(left, 128, `${profile.location.toUpperCase()}  ·  ON GITHUB SINCE ${since}`, { size: 14, fill: PAL.peach, ls: 3.5 })}
<text x="${left - 4}" y="236" class="d" font-size="124" fill="${PAL.cream}" letter-spacing="1" ${TL(profile.firstName.toUpperCase(), 124, 1)}>${esc(profile.firstName.toUpperCase())}</text>
<text x="${left - 4}" y="346" class="d" font-size="124" fill="url(#nameGrad)" letter-spacing="1" ${TL(profile.lastName.toUpperCase(), 124, 1)}>${esc(profile.lastName.toUpperCase())}</text>
<text x="${left}" y="398" class="d" font-size="34" fill="${PAL.lav}" letter-spacing="3" ${TL(profile.identity[0].toUpperCase(), 34, 3)}>${esc(profile.identity[0].toUpperCase())}</text>
${tag(left, 434, `${profile.role.toUpperCase()} @ ${profile.company.toUpperCase()}`, { size: 14, fill: '#e8dcff', ls: 1.6 })}
${eduTags}`;

  // Three live stats. A zero never takes the middle slot: with a quiet month it shows the year instead,
  // and with a quiet year it is left out.
  const allLit = lit.lit >= lit.total, n = profile.projects.length, yr = data.totals.contributionsLastYear;
  const stat = (big, color, head, sub) => ({ big, color, head, sub });
  const stats = [stat(String(n).padStart(2, '0'), PAL.cream, 'BUILDINGS', 'one per project, below')];
  if (c30 > 0) stats.push(stat(String(c30), PAL.amber, 'WINDOWS LIT', allLit ? `all lit: ${c30} in 30 days` : 'one per contribution, 30 days'));
  else if (yr > 0) stats.push(stat(String(yr), PAL.amber, 'FLOORS BUILT', 'contributions, last 12 months'));
  const nw = newestWork(data, profile.projects);
  if (nw) {
    const d = nw.days, mo = Math.round(d / 30.4);
    const [big, head] = d < 1 ? ['TODAY', 'LAST BRICK LAID'] : d < 60 ? [String(d), d === 1 ? 'DAY SINCE THE LAST BRICK' : 'DAYS SINCE THE LAST BRICK'] : [String(mo), 'MONTHS SINCE THE LAST BRICK'];
    stats.push(stat(big, PAL.peach, head, ellipsize(`laid on ${nw.name.toLowerCase()}, ${fmtDate(nw.repo.pushedAt).toLowerCase()}`, 300, 12, 0.4)));
  }
  const xs = [0, 212, 472];
  const legend = `<g transform="translate(${left},560)">` + stats.map((st, i) => (i ? `<line x1="${xs[i] - 24}" y1="-40" x2="${xs[i] - 24}" y2="48" stroke="#fff" stroke-opacity=".14"/>` : '')
    + `<g transform="translate(${xs[i]},0)"><text x="0" y="0" class="d" font-size="54" fill="${st.color}" ${TL(st.big, 54)}>${esc(st.big)}</text>`
    + tag(0, 26, st.head, { size: 13, fill: PAL.cream, ls: 2.2 }) + tag(0, 46, st.sub, { size: 12, fill: '#cdb8ec', ls: 0.4 }) + '</g>').join('') + '</g>';

  const body = `<g clip-path="url(#frame)">${sky}${plane()}<g>${lit.svg}</g>${pins}${text}${legend}</g>
<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="25.5" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1.5"/>`;

  return {
    svg: svgDoc({
      w: W, h: H, title: `${profile.name}: the city he built`,
      desc: `An isometric city at dusk on the Nile in ${profile.location}. Each building is one of his projects. ${c30} windows are lit, one for each contribution in the last 30 days.`,
      css: MOTION, defs, body,
    }),
    windows: lit,
  };
}
