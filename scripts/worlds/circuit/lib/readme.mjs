// Assembles README.md: one continuous board, sliced into images that stack edge to edge.
// Every slice gets its global y (G) so the bus current flows across the seams. Key slices also
// ship a portrait mobile variant via <picture><source media="(max-width: 600px)">.
import { esc } from './svg.mjs';
import { hero } from './hero.mjs';
import { featured, nets } from './projects.mjs';
import { tile, TILE_PKGS } from './tiles.mjs';
import { toolbox } from './toolbox.mjs';
import { activity } from './activity.mjs';
import { ioStrip, port, footer, ports as portList } from './contact.mjs';
import * as M from './mobile.mjs';

const FEATURED = ['cortex', 'dose', 'attendance', 'bosla'];
const heightOf = svg => +svg.match(/viewBox="0 0 [\d.]+ ([\d.]+)"/)[1];
const img = (src, alt, w) => `<img src="assets/${src}" width="${w}" align="top" alt="${esc(alt)}">`;
const pic = (src, msrc, alt, w = '100%') => (msrc ? `<picture><source media="(max-width: 600px)" srcset="assets/${msrc}">${img(src, alt, w)}</picture>` : img(src, alt, w));
const link = (href, inner) => `<a href="${esc(href)}">${inner}</a>`;

export function readme(profile, D, put) {
  const rows = [];
  let G = 0, GM = 0; // global y in page units: desktop, and on mobile (where variants are 2x scale)
  // Full-width slice with optional mobile variant. mk(GM) builds the variant (600 wide, k=2).
  const slice = (name, svg, alt, href, mk) => {
    put(name, svg); G += heightOf(svg);
    let mname = null;
    const ms = mk && mk(GM);
    if (ms) { mname = 'm-' + name; put(mname, ms); GM += 2 * heightOf(ms); } else GM += heightOf(svg);
    rows.push(href ? link(href, pic(name, mname, alt)) : pic(name, mname, alt));
  };
  const L = profile.links || {};

  slice('hero.svg', hero(profile, D), `${profile.name}: ${profile.role} at ${profile.company}. ${(profile.identity || []).join('. ')}.`, L.website, gm => M.heroM(profile, D, gm));

  // --- parts: refs first, so nets can name their partners
  const projects = profile.projects || [];
  const feat = FEATURED.map(k => projects.find(p => p.key === k)).filter(Boolean);
  const rest = projects.filter(p => !feat.includes(p));
  const refOf = {}; let u = 2;
  [...feat, ...rest].forEach(p => (refOf[p.key] = `U${u++}`));
  const NET = nets(projects);
  feat.forEach((p, i) => {
    const side = i % 2 ? 'R' : 'L', f = `part-${p.key}.svg`, opts = { net: NET[p.key], refOf };
    slice(f, featured(p, refOf[p.key], D, side, 20 + i, { ...opts, G, first: i === 0, nParts: projects.length }),
      `${refOf[p.key]} ${p.name}: ${p.kind}. ${p.line}`, p.url, gm => M.featuredM(p, refOf[p.key], D, 20 + i, { ...opts, G: gm, first: i === 0, nParts: projects.length }));
  });
  const tiles = rest.map((p, i) => ({ p, pkg: TILE_PKGS[i % TILE_PKGS.length] }));
  if (tiles.length % 2) tiles.push({ dnp: true });
  for (let i = 0; i < tiles.length; i += 2) {
    const last = i + 2 >= tiles.length;
    let h = 0, hm = 0;
    const pair = tiles.slice(i, i + 2).map((t, j) => {
      const ref = t.dnp ? `U${u++}` : refOf[t.p.key], side = j ? 'R' : 'L';
      const f = t.dnp ? 'part-dnp.svg' : `part-${t.p.key}.svg`;
      const o = { dnp: !!t.dnp, net: t.p && NET[t.p.key], refOf, pkg: t.pkg, last };
      const svg = tile(t.p, ref, D, side, 40 + i + j, { ...o, G }), msvg = tile(t.p, ref, D, side, 40 + i + j, { ...o, G: GM, mobile: true });
      put(f, svg); put('m-' + f, msvg); h = heightOf(svg); hm = heightOf(msvg);
      const href = t.dnp ? `${L.github}?tab=repositories` : t.p.url;
      const alt = t.dnp ? `${ref} reserved for the next build: browse all repositories` : `${ref} ${t.p.name}: ${t.p.kind}. ${t.p.line}`;
      return link(href, pic(f, 'm-' + f, alt, '50%'));
    });
    G += h; GM += hm;
    rows.push(pair.join(''));
  }

  // --- bill of materials and live activity (each in its own functional block)
  const box = profile.toolbox || {};
  slice('bom.svg', toolbox(profile, D, { G }), 'Toolbox: ' + Object.entries(box).map(([k, v]) => `${k}: ${v.join(', ')}`).join('; '), `${L.github}?tab=repositories`, gm => M.bomM(profile, D, gm));
  slice('scope.svg', activity(profile, D, { G }), `GitHub activity, last 12 months: ${D.contributions} contributions, ${D.activeDays} active days, longest run ${D.longest} days${D.lastActive ? `, last contribution ${D.lastActive}` : ''}.`, L.github, gm => M.scopeM(profile, D, gm));

  // --- I/O edge: the bus turns inward and ends in one linked connector per way to reach him
  const P = portList(profile);
  const io = ioStrip({ G, n: P.length });
  slice('sec-io.svg', io.svg, 'Input / output: the board edge connectors', L.website);
  rows.push(P.map((pt, i) => {
    const f = `io-${pt.label.toLowerCase()}.svg`;
    put(f, port(pt, `J${i + 1}`, i, io.ends[i], P.length));
    return link(pt.href, img(f, pt.alt, '25%'));
  }).join(''));
  const ft = footer(profile, D); put('footer.svg', ft);
  rows.push(link(L.website || L.github, img('footer.svg', `Board footer: rebuilt daily from live GitHub data, last build ${D.rev}.`, '100%')));

  // Plain-text caption + datasheet: real markdown, readable on any screen and by screen readers.
  const facts = [`${profile.role} at ${profile.company}`, profile.location].filter(Boolean).join(' · ');
  const links = P.map(pt => `<a href="${esc(pt.href)}">${esc(pt.short)}</a>`).join(' · ');
  const caption = `<p align="center"><b>${esc(profile.name)}</b> · ${esc(facts)}<br>\n<sub>${esc((profile.identity || []).join(' · '))}</sub><br>\n${links}</p>`;
  const projList = projects.map(p => `- **[${p.name}](${p.url})** · ${p.kind}. ${p.line}`).join('\n');
  const tools = Object.entries(box).map(([k, v]) => `- **${k[0].toUpperCase() + k.slice(1)}:** ${v.join(', ')}`).join('\n');
  const prev = profile.previousRole ? ` (previously ${profile.previousRole})` : '';
  const sheet = `<details>\n<summary><b>U1 datasheet</b> · plain text</summary>\n\n**${profile.name}** · ${profile.role} at ${profile.company}${prev} · ${profile.education} · ${profile.location}\n\n${projList}\n\n${tools}\n\n<sub>Board re-routed daily from live GitHub data · last build ${D.rev}</sub>\n</details>`;

  return `<p align="center">\n${rows.map((r, i) => r + (i < rows.length - 1 ? '<br>' : '')).join('\n')}\n</p>\n\n${caption}\n\n${sheet}\n`;
}
