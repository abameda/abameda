// SHEET 05: sign-off. Approval block + red seal, then four linked contact tags (each its own SVG).
import { C, W, T, L, R, Ci, r2, up, esc, svgDoc, sheet, sheetHead, arrow, FONT } from './svg.mjs';
import { dmy, fitSize, dispWidth, host, monoWidth } from './data.mjs';
import { redNote, redArrow, rng } from './parts.mjs';
import { link, img } from './readme.mjs';

// Rubber seal: ring text on a circle, centre word, date. Slightly uneven ink via small gaps.
function seal(cx, cy, r, ring, centre, date, rot = -9) {
  const rnd = rng(42), rr = r - 24;
  let s = `<g transform="rotate(${rot} ${cx} ${cy})" opacity=".93">`;
  s += `<path id="ring" d="M${cx - rr} ${cy}a${rr} ${rr} 0 1 1 ${2 * rr} 0a${rr} ${rr} 0 1 1 ${-2 * rr} 0" fill="none"/>`;
  s += Ci(cx, cy, r, { c: C.red, w: 3.6 }) + Ci(cx, cy, r - 8, { c: C.red, w: 1.3 }) + Ci(cx, cy, r - 44, { c: C.red, w: 1.8 });
  s += `<text font-family="${FONT.mono}" font-size="15" fill="${C.red}" letter-spacing="1.5"><textPath href="#ring" xlink:href="#ring" startOffset="0" textLength="${r2(2 * Math.PI * rr - 8)}" lengthAdjust="spacing">${esc(ring)}</textPath></text>`;
  s += T(cx, cy + 6, centre, { size: 34, font: 'disp', fill: C.red, anchor: 'middle', tl: (r - 52) * 1.9 });
  s += L(cx - r + 58, cy + 20, cx + r - 58, cy + 20, { c: C.red, w: 1.5 }) + T(cx, cy + 44, date, { size: 15, fill: C.red, anchor: 'middle', ls: 2 });
  for (let i = 0; i < 16; i++) { const a = rnd() * Math.PI * 2; s += `<circle cx="${r2(cx + Math.cos(a) * r)}" cy="${r2(cy + Math.sin(a) * r)}" r="${r2(1 + rnd() * 2)}" fill="${C.sheet}"/>`; }
  return s + '</g>';
}

// The four destinations, shared by the DISTRIBUTION row and the contact tags.
function destinations(profile) {
  const L2 = profile.links, inId = L2.linkedin && host(L2.linkedin).split('/').filter(Boolean).pop();
  return [
    L2.website && { key: 'web', label: 'WEBSITE', value: host(L2.website), stamp: 'VISIT', href: L2.website, alt: `Visit ${host(L2.website)}` },
    L2.linkedin && { key: 'linkedin', label: 'LINKEDIN', value: `in/${inId}`, stamp: 'CONNECT', href: L2.linkedin, alt: `Connect on LinkedIn: in/${inId}` },
    L2.cv && { key: 'cv', label: 'CURRICULUM VITAE', value: 'CV (PDF)', stamp: 'DOWNLOAD', href: L2.cv, alt: `Download ${profile.firstName}'s CV (PDF)` },
    L2.github && { key: 'github', label: 'GITHUB', value: `@${profile.login}`, stamp: 'FOLLOW', href: L2.github, alt: `Follow @${profile.login} on GitHub` },
  ].filter(Boolean);
}

function signSheet(profile, data, ctx, dests) {
  const w = 1200, h = 380, sh = sheet(w, h, { nx: 8, ny: 2 });
  let b = sh.body + sheetHead(54, 50, '05', 'SIGN-OFF', 'APPROVAL BLOCK  ·  END OF DRAWING SET');
  const x = 56, y = 126, cw = [160, 400, 190], rh = 44, tw = cw[0] + cw[1] + cw[2];
  const dist = dests.map(d => d.value).join(' · ');
  const rows = [
    ['DRAWN', up(profile.name), `@${up(profile.login)}`],
    ['DISTRIBUTION', dist, null],
    ['CHECKED', '', 'DATE'],
    ['APPROVED', 'STAMPED  →', dmy(data.generatedAt)],
  ];
  rows.forEach((r, i) => {
    const ry = y + i * rh, span = r[2] === null;
    b += R(x, ry, tw, rh, { c: C.line, w: W.thin }) + L(x + cw[0], ry, x + cw[0], ry + rh, { c: C.line, w: W.thin });
    if (!span) b += L(x + cw[0] + cw[1], ry, x + cw[0] + cw[1], ry + rh, { c: C.line, w: W.thin });
    b += T(x + 12, ry + 27, r[0], { size: 11, fill: C.muted, ls: 1.4 });
    const room = (span ? cw[1] + cw[2] : cw[1]) - 26;
    if (r[1] && i === 0) b += T(x + cw[0] + 12, ry + 29, r[1], { size: 17, font: 'disp', fill: C.ink, ls: 0.4, tl: dispWidth(r[1], 17) > room ? room : null });
    else if (r[1]) b += T(x + cw[0] + 12, ry + 28, r[1], { size: 14, fill: i === 3 ? C.muted : C.ink, ls: 0.4, tl: monoWidth(r[1], 14, 0.4) > room ? room : null });
    if (r[2]) b += T(x + cw[0] + cw[1] + 12, ry + 28, r[2], { size: 13, fill: i === 2 ? C.muted : C.line, ls: 0.8 });
  });
  b += R(x, y, tw, rh * rows.length, { c: C.ink, w: W.thick });
  // the open signature line, annotated in red pen
  const sy = y + rh * 2 + 32;
  b += L(x + cw[0] + 14, sy, x + cw[0] + cw[1] - 20, sy, { c: C.faint, w: W.hair, dash: '3 4' });
  b += redNote(x + cw[0] + 18, sy - 5, profile.redlines?.signoff ?? 'your name here', { size: 23, rot: -2 });
  b += redArrow(x + cw[0] + 214, sy + 44, x + cw[0] + 182, sy + 6, { bow: 0.3 });
  // the seal overprints the edge of the approval block, like a real stamp
  const ring = `${up(profile.name)}  ·  ${up(profile.identity[0])}  ·  ${up(profile.location)}  ·  `;
  b += seal(898, 196, 132, ring, 'APPROVED', dmy(data.generatedAt));
  b += T(1146, h - 40, 'END OF DRAWING SET', { size: 11.5, fill: C.muted, anchor: 'end', ls: 2 });
  return svgDoc({
    w, h, title: `Sign-off: ${profile.name}`,
    desc: `Approval block for ${profile.name}, ${profile.role} at ${profile.company}, ${profile.location}. Distribution: ${dist}.`,
    fonts: ['disp', 'mono', 'hand'], defs: sh.defs, body: b,
  });
}

// Contact tag. Only the display face is embedded; the small label uses the system monospace.
function tag(i, d) {
  const w = 300, h = 140, sh = sheet(w, h, { zones: false, margin: 6 });
  let b = sh.body + R(14, 14, w - 28, h - 28, { c: C.ink, w: W.thick });
  b += Ci(32, 34, 6, { c: C.ink, w: W.med }) + T(48, 38.5, `05.${i + 1}  ·  ${d.label}`, { size: 11.5, fill: C.muted, ls: 1.2 });
  b += L(26, 52, w - 26, 52, { c: C.faint, w: W.hair });
  const size = fitSize(d.value, 24, w - 60);
  b += T(28, 84, d.value, { size: r2(size), font: 'disp', fill: C.ink, tl: dispWidth(d.value, size) > w - 60 ? w - 60 : null });
  b += L(w - 68, 106, w - 36, 106, { c: C.red, w: W.med }) + arrow(w - 68, 106, w - 28, 106, { c: C.red, s: 10, wd: 4 });
  const sw = d.stamp.length * 10 + 22, sx = 28 + sw / 2, sy = 106;
  b += `<g transform="rotate(-4 ${r2(sx)} ${sy})" opacity=".92">${R(sx - sw / 2, sy - 10, sw, 20, { c: C.red, w: 2, rx: 3 })}${T(sx, sy + 4.5, d.stamp, { size: 12, font: 'disp', fill: C.red, anchor: 'middle', ls: 1 })}</g>`;
  return svgDoc({ w, h, title: d.alt, desc: `${d.label}: ${d.value}`, fonts: ['disp'], defs: sh.defs, body: b });
}

export function build(profile, data, ctx, emit) {
  const dests = destinations(profile);
  emit('signoff.svg', signSheet(profile, data, ctx, dests));
  dests.forEach((d, i) => emit(`c-${d.key}.svg`, tag(i, d)));
  ctx.md ??= [];
  ctx.md.push(`<p align="center">${link(profile.links.website || profile.links.github, img('signoff.svg', `Sign-off: ${profile.name}, ${profile.role} at ${profile.company}, ${profile.location}. Approved.`))}</p>`);
  const pct = (Math.floor(1000 / dests.length) / 10) + '%';
  ctx.md.push(`<p align="center">${dests.map(d => link(d.href, img(`c-${d.key}.svg`, d.alt, { width: pct }))).join('')}</p>`);
  ctx.dests = dests;
}
