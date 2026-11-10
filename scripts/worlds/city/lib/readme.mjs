// README.md: one continuous walk through the city. Only GitHub-safe HTML (p/a/img/b/sub/br).
// Images that share a row sit edge to edge with no whitespace between them; each SVG carries its own
// transparent gutter, so tiles, the station strip and full-width cards all share one grid.
import { fmtDate } from './svg.mjs';
import { stationMeta, stationWidth, hallWidth } from './contact.mjs';
import { inDesign } from './tiles.mjs';

const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// Every image has a phone composition (assets/m-<name>), served below 600px; the img stays the desktop art.
const img = (src, alt, width = '100%') => `<picture><source media="(max-width: 600px)" srcset="assets/m-${src}"><img src="assets/${src}" width="${width}" alt="${attr(alt)}"></picture>`;
const link = (href, inner) => `<a href="${attr(href)}">${inner}</a>`;

export function readme(data, profile, projects, { featuredCount = 4 } = {}) {
  const [creative, ...rest] = profile.identity;
  const founder = rest.find(r => /^founder/i.test(r));
  const others = rest.filter(r => r !== founder);
  const num = i => String(i + 1).padStart(2, '0');
  const alt = p => `${num(projects.indexOf(p))} ${p.name}, ${p.kind}: ${p.line}`;
  const gh = profile.links.github || `https://github.com/${profile.login}`;
  const out = [];

  out.push(`<p align="center">${link(profile.links.website || gh, img('hero.svg', `${profile.name}: ${creative}. An isometric city at dusk on the Nile where every building is one of his projects.`))}</p>`);
  out.push(`<p align="center">
<b>${creative}</b> from ${profile.location}. ${profile.role} at <b>${profile.company}</b>${profile.previousRole ? ` (previously ${profile.previousRole})` : ''}.<br>
${profile.education}.${founder ? ` ${founder}.` : ''}<br>
<sub>${others.join(' · ')}</sub>
</p>`);

  // Landmark Avenue: the street plate is painted into the first postcard
  const featured = projects.slice(0, featuredCount), small = projects.slice(featuredCount);
  featured.forEach(p => out.push(`<p>${link(p.url, img(`project-${p.key}.svg`, alt(p)))}</p>`));
  const tiles = small.filter(p => !inDesign(p)), sites = small.filter(inDesign);
  for (let i = 0; i < tiles.length; i += 2) {
    out.push(`<p>${tiles.slice(i, i + 2).map(p => link(p.url, img(`project-${p.key}.svg`, alt(p), '49.9%'))).join('')}</p>`);
  }
  sites.forEach(p => out.push(`<p>${link(p.url, img(`project-${p.key}.svg`, alt(p)))}</p>`));

  // Market Street
  const tb = Object.entries(profile.toolbox).map(([k, v]) => `${k}: ${v.join(', ')}`).join('; ');
  out.push(`<p>${link(`${gh}?tab=repositories`, img('toolbox.svg', `Market Street, the toolbox. ${tb}`))}</p>`);

  // Census Square
  const T = data.totals;
  out.push(`<p>${link(gh, img('census.svg', `Census Square: ${T.contributionsLastYear} contributions in the last 12 months, drawn as a city district where each contribution is one floor. ${T.commitsLastYear} commits, ${T.pullRequestsLastYear} pull requests, ${T.contributionsLast30Days} in the last 30 days.`))}</p>`);

  // Central Station: one strip of linked stops
  const links = Object.entries(profile.links);
  const hallImg = link(gh, img('station-hall.svg', `Central Station: ${links.length} stops out of the city`, hallWidth(links.length)));
  out.push(`<p>${hallImg}${links.map(([k, u], i) => { const m = stationMeta(k, u); return link(u, img(`station-${k}.svg`, `Stop ${i + 1}: ${m.name}, ${m.sub}`, stationWidth(i, links.length))); }).join('')}</p>`);

  out.push(`<p align="center"><sub>Every building is a real project. The lights, the towers and the census are rebuilt daily from live GitHub data. Last census: ${fmtDate(data.generatedAt)}.</sub></p>`);
  return out.join('\n\n') + '\n';
}
