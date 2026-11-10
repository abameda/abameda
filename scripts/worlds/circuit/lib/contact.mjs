// I/O edge: the system bus finally terminates in four edge connectors, one linked image each.
// Then the footer: the board's bottom edge with fab notes and a drawing title block.
import { C, doc, text, fit, board, trace, flow, chamfer, poly, via, pad, hole, fid, tw, smd, BUS, BUS_PHASE, BLOCK, blockTop, blockSides } from './svg.mjs';
import { led } from './parts.mjs';
import { humanDate } from './data.mjs';
import { host } from './projects.mjs';

export const DROPS = [150, 450, 750, 1050];

export function ports(profile) {
  const L = profile.links || {};
  return [
    L.website && { kind: 'rj45', label: 'WEBSITE', sub: host(L.website), href: L.website, alt: `Website: ${host(L.website)}`, short: 'Website' },
    L.linkedin && { kind: 'usbc', label: 'LINKEDIN', sub: 'in/' + L.linkedin.replace(/\/$/, '').split('/').pop(), href: L.linkedin, alt: 'LinkedIn profile', short: 'LinkedIn' },
    L.cv && { kind: 'sd', label: 'CV', sub: `${host(L.website || L.cv).split('/')[0]} · PDF`, href: L.cv, alt: 'Download CV (PDF)', short: 'CV (PDF)' },
    L.github && { kind: 'header', label: 'GITHUB', sub: '@' + profile.login, href: L.github, alt: `GitHub profile: @${profile.login}`, short: 'GitHub' },
  ].filter(Boolean);
}

// Strip whose bus lines turn inward and drop into the connectors below. The two outer lines end
// in termination resistors to ground. Returns the flow offsets where each drop leaves the image.
export function ioStrip({ G = 0, n = 4 } = {}) {
  const W = 1200, H = 204;
  let g = board(W, H), cur = '';
  g += blockTop(40, BLOCK.L, BLOCK.R, '05', 'I/O', 'EVERY BUS ENDS AT A CONNECTOR') + blockSides(40, H);
  const spec = [[BUS.L[1], 1, 132, 0], [BUS.L[2], 2, 112, 1], [BUS.R[0], 3, 112, 2], [BUS.R[1], 4, 132, 3]];
  const ends = [];
  spec.forEach(([x, line, yt, di]) => {
    if (di >= n) { g += trace(`M${x} 0V${yt}`, 3.4) + via(x, yt, 5); return; }
    const r = chamfer([[x, 0], [x, yt], [DROPS[di], yt], [DROPS[di], H]], 14);
    const o = G + BUS_PHASE[line];
    g += trace(r.d, 3.4); cur += flow(r, o); ends[di] = o + r.len;
  });
  for (const [x, line, dir] of [[BUS.L[0], 0, 1], [BUS.R[2], 5, -1]]) {
    const yr = 160, rx = dir > 0 ? x + 34 : x - 64;
    const r = chamfer([[x, 0], [x, yr], [x + dir * 34, yr]], 10);
    g += trace(r.d, 3.4) + smd(rx, yr - 7, { w: 30, h: 14 });
    const gx = dir > 0 ? rx + 30 + 24 : rx - 24;
    g += trace(`M${dir > 0 ? rx + 30 : rx} ${yr}H${gx}V${yr + 12}`, 2.4);
    g += `<path d="M${gx - 10} ${yr + 12}H${gx + 10}M${gx - 6} ${yr + 17}H${gx + 6}M${gx - 2} ${yr + 22}H${gx + 2}" stroke="${C.silk2}" stroke-width="1.6" opacity=".7"/>`;
    g += text(rx + 15, yr + 30, dir > 0 ? 'R9' : 'R10', { size: 13, ls: 1.4, fill: C.dim, anchor: 'middle' });
    cur += flow(r, G + BUS_PHASE[line]);
  }
  for (const x of DROPS.slice(0, n)) g += `<path d="M${x - 6} ${H}A6 6 0 0 1 ${x + 6} ${H}Z" fill="url(#au)"/>`;
  return { svg: doc({ w: W, h: H, title: 'I/O: the bus turns toward the edge connectors', desc: 'Four bus lines turn inward and drop into the connectors below; the outer two end in termination resistors.', body: g + cur }), ends };
}

// --- connector drawings, centred on (cx, cy)
const shell = (x, y, w, h, rx = 6) => `<rect x="${x + 3}" y="${y + 5}" width="${w}" height="${h}" rx="${rx}" fill="#000" opacity=".5"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#auH)"/><rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" rx="${rx - 2}" fill="none" stroke="#5B4416" stroke-opacity=".5"/>`;
const CONN = {
  rj45(cx, cy) {
    let g = shell(cx - 62, cy - 50, 124, 100, 6);
    g += `<path d="M${cx - 42} ${cy - 30}H${cx + 42}V${cy + 18}H${cx + 16}V${cy + 32}H${cx - 16}V${cy + 18}H${cx - 42}Z" fill="#050606"/>`;
    for (let i = 0; i < 8; i++) g += `<rect x="${cx - 30 + i * 8}" y="${cy - 30}" width="4" height="14" fill="url(#au)"/>`;
    return g + led(cx - 46, cy + 38, { label: false }) + `<rect x="${cx + 34}" y="${cy + 33}" width="14" height="10" fill="${C.goldHi}" opacity=".85"/>`;
  },
  usbc(cx, cy) {
    let g = shell(cx - 66, cy - 30, 132, 60, 30);
    g += `<rect x="${cx - 50}" y="${cy - 15}" width="100" height="30" rx="15" fill="#050606"/><rect x="${cx - 32}" y="${cy - 5}" width="64" height="10" rx="3" fill="#1C1F1D"/>`;
    for (let i = 0; i < 6; i++) g += `<rect x="${cx - 26 + i * 10}" y="${cy - 3}" width="5" height="6" fill="url(#au)"/>`;
    return g;
  },
  sd(cx, cy) {
    let g = shell(cx - 70, cy - 48, 140, 96, 4);
    g += `<rect x="${cx - 54}" y="${cy - 30}" width="108" height="78" fill="#050606"/>`;
    g += `<path d="M${cx - 46} ${cy - 22}H${cx + 30}L${cx + 46} ${cy - 6}V${cy + 64}H${cx - 46}Z" fill="#1E2220" stroke="#353B37"/>`;
    for (let i = 0; i < 7; i++) g += `<rect x="${cx - 38 + i * 11}" y="${cy - 16}" width="6" height="12" fill="url(#au)"/>`;
    return g + text(cx, cy + 24, 'DATASHEET', { size: 13, ls: 1, anchor: 'middle', fill: C.silk }) + text(cx, cy + 42, '.PDF', { size: 13, ls: 1, anchor: 'middle', fill: C.gold });
  },
  header(cx, cy) {
    let g = `<rect x="${cx - 72}" y="${cy - 34}" width="144" height="68" rx="3" fill="#121514" stroke="${C.pkgEdge}"/>`;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) {
      const x = cx - 56 + c * 28, y = cy - 14 + r * 28;
      g += `<rect x="${x - 8}" y="${y - 8}" width="16" height="16" fill="#060707"/><rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="url(#au)"/>`;
    }
    return g + `<path d="M${cx - 76} ${cy - 22}l-8 -6v12z" fill="${C.silk2}"/>`;
  },
};

// One connector image (25% wide, so 1 unit = 1 page unit). o = flow offset arriving from above.
export function port(pt, ref, idx, o = 0, n = 4) {
  const W = 300, H = 300, cx = 150, cy = 126, by = H - 16;
  let g = board(W, H);
  const r = poly([[cx, 0], [cx, cy - 58]]);
  g += trace(r.d, 3.4) + `<path d="M${cx - 6} 0A6 6 0 0 0 ${cx + 6} 0Z" fill="url(#au)"/>` + via(cx, cy - 60, 6);
  g += CONN[pt.kind](cx, cy);
  g += text(24, 38, ref, { size: 18, ls: 2, fill: C.silk2 });
  g += text(cx, 232, pt.label, { size: fit(pt.label, 250, 36, 'D'), font: 'D', anchor: 'middle', fill: C.silk });
  g += text(cx, 262, pt.sub, { size: Math.min(16, fit(pt.sub, 270, 16, 'M', 1)), ls: 1, anchor: 'middle', fill: C.gold });
  const dash = `fill="none" stroke="${C.silk2}" stroke-width="1.4" stroke-dasharray="7 6" opacity=".5"`;
  const xl = idx === 0 ? BLOCK.L : 0, xr = idx === n - 1 ? BLOCK.R - 900 : W;
  g += `<path d="M${xl} ${by}H${xr}" ${dash}/>`;
  if (idx === 0) g += `<path d="M${BLOCK.L} 0V${by}" ${dash}/>`;
  if (idx === n - 1) g += `<path d="M${xr} 0V${by}" ${dash}/>`;
  return doc({ w: W, h: H, title: `${ref} ${pt.label}: ${pt.alt}`, desc: pt.alt, body: g + flow(r, o) });
}

// Bottom edge of the board: holes, fab notes and an engineering-drawing title block.
export function footer(profile, D) {
  const W = 1200, H = 236;
  let g = board(W, H, { rb: 18 });
  g += hole(46, H - 46) + hole(1154, H - 46) + fid(98, H - 46) + fid(1102, H - 46);
  const fx = 104;
  g += text(fx, 44, 'FAB NOTES', { size: 16, ls: 3, fill: C.silk });
  const notes = [
    '1. REBUILT DAILY FROM LIVE GITHUB DATA.',
    `2. LAST BUILD ${humanDate(D.ref)} · ${D.ref.slice(11, 16)} UTC.`,
    '3. EVERY PART LINKS TO ITS PROJECT.',
    '4. J1–J4 ARE THE WAYS IN.',
    profile.location ? `5. BASED IN ${profile.location.toUpperCase()}.` : '',
  ].filter(Boolean);
  notes.forEach((t, i) => (g += text(fx, 76 + i * 24, t, { size: 15, ls: 1, fill: C.dim })));
  const bx = 690, by = 26, bw = 420;
  const cell = (x, y, w, h, k, v, vs = 18, vf = 'M') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${C.silk2}" stroke-opacity=".45"/>` + text(x + 12, y + 20, k, { size: 12, ls: 1.6, fill: C.dim }) + text(x + 12, y + h - 14, v, { size: Math.min(vs, fit(v, w - 24, vs, vf, vf === 'M' ? 1 : 0.5)), font: vf, ls: vf === 'M' ? 1 : 0.5, fill: C.silk });
  g += cell(bx, by, bw, 64, 'TITLE', `${profile.login.toUpperCase()} MAINBOARD`, 24, 'D');
  g += cell(bx, by + 64, 170, 64, 'DESIGNER', `${String(profile.firstName || '').toUpperCase()} ${String(profile.lastName || '')[0] || ''}.`);
  g += cell(bx + 170, by + 64, 150, 64, 'REV', D.rev);
  g += cell(bx + 320, by + 64, 100, 64, 'SHEET', '1 / 1');
  g += text(bx, by + 160, `© ${D.ref.slice(0, 4)} ${profile.name.toUpperCase()}`, { size: 14, ls: 1.4, fill: C.dim });
  return doc({ w: W, h: H, title: 'Board footer: fab notes and title block', desc: notes.join(' '), body: g });
}
