// Phone hero: his name across the top of the sky, the whole city below it at almost desktop scale,
// then the three live stats as rows. Same city drawing, same lighting, same live bindings.
import { svgDoc, f, esc, P as PAL, stars, moonPhase, moonPath, fmtDate, tag, TL, monoFit, newestWork, ellipsize } from './svg.mjs';
import { iso } from './iso.mjs';
import { lightUp } from './buildings-a.mjs';
import { drawCity, pinLabels, LAYOUT } from './city.mjs';
import { MOTION } from './motion.mjs';
import { cairoTime, plateau, HERO_GRADS } from './hero.mjs';
import { fitSize } from './scene.mjs';
import { MW, PAD, COL } from './mobile.mjs';

// Roof flags at phone size: drawn by the desktop pinLabels() in a space scaled by K, so the
// labels come out K times larger while every pole still starts on its own roof.
const K = 1.42;
const FLAGS = { cortex: [42, -21], attendance: [-50, -30], dose: [17, -37], bosla: [10, -32], 'mnu-sms': [-18, -30], thread: [4, -35], printer: [8, -28], yosr: [14, -23], 'cortex-ops': [10, -31] };

export function heroM(data, profile) {
  const S = 16.6, { X, Y } = LAYOUT, C = 0.866;
  const ox = MW / 2 - ((X - Y) / 2) * C * S, oy = 712;
  const I = iso(ox, oy, S, 'hm');
  const city = drawCity(I, { clock: cairoTime(data.generatedAt), keys: new Set(profile.projects.map(p => p.key)) });
  const c30 = data.totals.contributionsLast30Days, lit = lightUp(city.svg, c30, 'hero');
  const pinsK = Object.fromEntries(Object.entries(city.pins).map(([k, [x, y]]) => [k, [x / K, y / K]]));
  const pins = `<g transform="scale(${K})">${pinLabels(pinsK, profile.projects, { flags: FLAGS })}</g>`;
  const phase = moonPhase(data.generatedAt), since = new Date(data.user.createdAt).getUTCFullYear();
  const horizon = oy + 236, mx = MW - 44, my = 40;

  // the name block in the open sky
  const first = profile.firstName.toUpperCase(), last = profile.lastName.toUpperCase();
  const ns = Math.min(fitSize(first, COL + 6, 120, 1), fitSize(last, COL + 6, 120, 1)), b1 = 92 + ns * 0.74, b2 = b1 + ns * 0.96;
  const loc = `${profile.location.toUpperCase()} · ON GITHUB SINCE ${since}`;
  let text = tag(PAD, 64, loc, { size: f(Math.min(19, monoFit(loc, COL - 70, 19, 2.2))), fill: PAL.peach, ls: 2.2 })
    + `<text x="${PAD - 4}" y="${f(b1)}" class="d" font-size="${f(ns)}" fill="${PAL.cream}" letter-spacing="1" ${TL(first, ns, 1)}>${esc(first)}</text>`
    + `<text x="${PAD - 4}" y="${f(b2)}" class="d" font-size="${f(ns)}" fill="url(#nameGrad)" letter-spacing="1" ${TL(last, ns, 1)}>${esc(last)}</text>`;
  const idn = profile.identity[0].toUpperCase(), is = fitSize(idn, COL, 42, 3);
  text += `<text x="${PAD}" y="${f(b2 + 58)}" class="d" font-size="${f(is)}" fill="${PAL.lav}" letter-spacing="3" ${TL(idn, is, 3)}>${esc(idn)}</text>`;
  const role = `${profile.role.toUpperCase()} @ ${profile.company.toUpperCase()}`;
  const edu = profile.education.toUpperCase(), eduLines = edu.includes(',') ? [edu.slice(0, edu.indexOf(',')), edu.slice(edu.indexOf(',') + 1).trim()] : [edu];
  [role, ...eduLines].forEach((l, i) => { text += tag(PAD, b2 + 104 + i * 32, l, { size: f(Math.min(21, monoFit(l, COL, 21, 1.4))), fill: '#e8dcff', ls: 1.4 }); });

  // the same three live stats as desktop (a zero never leads), set as rows under the city
  const allLit = lit.lit >= lit.total, n = profile.projects.length, yr = data.totals.contributionsLastYear;
  const stats = [[String(n).padStart(2, '0'), PAL.cream, 'BUILDINGS', 'one per project, below']];
  if (c30 > 0) stats.push([String(c30), PAL.amber, 'WINDOWS LIT', allLit ? `all lit: ${c30} in 30 days` : 'one per contribution, 30 days']);
  else if (yr > 0) stats.push([String(yr), PAL.amber, 'FLOORS BUILT', 'contributions, last 12 months']);
  const nw = newestWork(data, profile.projects);
  if (nw) {
    const d = nw.days, mo = Math.round(d / 30.4);
    const [big, head] = d < 1 ? ['TODAY', 'LAST BRICK LAID'] : d < 60 ? [String(d), d === 1 ? 'DAY SINCE THE LAST BRICK' : 'DAYS SINCE THE LAST BRICK'] : [String(mo), 'MONTHS SINCE THE LAST BRICK'];
    stats.push([big, PAL.peach, head, ellipsize(`laid on ${nw.name.toLowerCase()}, ${fmtDate(nw.repo.pushedAt).toLowerCase()}`, COL - 140, 18, 0.4)]);
  }
  const sy0 = oy + 428, rowH = 92;
  let legend = '';
  stats.forEach(([big, col, head, sub], i) => {
    const y = sy0 + i * rowH, bs = fitSize(big, 112, 66, 0);
    if (i) legend += `<line x1="${PAD}" y1="${y - 62}" x2="${PAD + COL}" y2="${y - 62}" stroke="#fff" stroke-opacity=".14"/>`;
    legend += `<text x="${PAD}" y="${y}" class="d" font-size="${f(bs)}" fill="${col}" ${TL(big, bs)}>${esc(big)}</text>`
      + tag(PAD + 136, y - 26, head, { size: f(Math.min(20, monoFit(head, COL - 136, 20, 1.8))), fill: PAL.cream, ls: 1.8 })
      + tag(PAD + 136, y + 2, sub, { size: 18, fill: '#cdb8ec', ls: 0.4 });
  });
  const Ht = Math.round(sy0 + (stats.length - 1) * rowH + 48);

  const defs = `<clipPath id="frame"><rect width="${MW}" height="${Ht}" rx="26"/></clipPath>
<linearGradient id="skyM" x1="0" y1="0" x2="0" y2="${horizon + 40}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#120a2e"/><stop offset=".3" stop-color="#26144f"/><stop offset=".55" stop-color="#55286f"/><stop offset=".74" stop-color="#a5446c"/><stop offset=".86" stop-color="#ec7266"/><stop offset="1" stop-color="#ffb47c"/></linearGradient>
${HERO_GRADS}${I.defs}`;
  const sky = `<rect width="${MW}" height="${Ht}" fill="url(#skyM)"/>` + stars(MW, 520, 60, 'sky', { maxY: 520 })
    + `<circle cx="${mx}" cy="${my}" r="40" fill="url(#moonGlow)" opacity="${f(0.25 + 0.75 * Math.sin(phase * Math.PI))}"/><circle cx="${mx}" cy="${my}" r="14" fill="#fff1df" opacity=".12"/>`
    + `<path d="${moonPath(mx, my, 14, phase)}" fill="#fff1df"/>`
    + `<circle cx="470" cy="${horizon + 20}" r="230" fill="url(#sunGlow)"/><circle cx="470" cy="${horizon + 20}" r="104" fill="url(#sun)"/>`
    + `<g transform="translate(0,${horizon - 492})">${plateau()}</g><rect x="0" y="${horizon + 160}" width="${MW}" height="${Ht}" fill="#1c1036"/>`
    + `<ellipse cx="${MW / 2 + 40}" cy="${oy + 300}" rx="300" ry="44" fill="url(#slabShadow)"/>`;
  const body = `<g clip-path="url(#frame)">${sky}<g>${lit.svg}</g>${pins}${text}${legend}</g>
<rect x=".75" y=".75" width="${MW - 1.5}" height="${Ht - 1.5}" rx="25.5" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1.5"/>`;
  return svgDoc({
    w: MW, h: Ht, title: `${profile.name}: the city he built`,
    desc: `An isometric city at dusk on the Nile in ${profile.location}. Each building is one of his projects. ${c30} windows are lit, one for each contribution in the last 30 days.`,
    css: MOTION, defs, body,
  });
}
