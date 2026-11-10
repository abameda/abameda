// Part drawings for CORTEX (isometric exploded assembly) and DÖSE (orthographic flacon, half section).
import { C, W, T, L, R, P, Ci, DASH, r2, up, dimH, dimV, balloon } from './svg.mjs';
import { redNote, redArrow, callout } from './parts.mjs';
import { features } from './data.mjs';

const COS = Math.cos(Math.PI / 6), SIN = 0.5;

// CORTEX: three exploded plates (design / build / run) on a common axis.
export function cortex(box, p) {
  const Z = 142, t = 15, gap = 86;
  const cx = box.x + box.w * 0.4, top = box.y + 46;
  const iso = (u, v, z, oy) => [cx + (u - v) * COS, oy + (u + v) * SIN - z];
  const pts = a => a.map(q => `${r2(q[0])} ${r2(q[1])}`).join('L');
  const verbs = ((p.line.match(/(\w+s),\s+(\w+s)\s+and\s+(\w+s)/) || []).slice(1)).map(up);
  const labels = verbs.length === 3 ? verbs : ['DESIGNS', 'BUILDS', 'RUNS'];
  // the three verbs share one object in the project line: it is written once, under the last plate
  const obj = up((p.line.match(/\w+s\s+and\s+\w+s\s+([^.,;]+)/) || [])[1] || '').split(' ');
  const subs = ['', '', obj.length > 1 ? [obj.slice(0, -1).join(' '), obj.at(-1)] : obj.filter(Boolean)];
  let s = '', css = '';
  // assembly axis (centre line through the plate centres)
  const axis = iso(Z / 2, Z / 2, 0, top);
  s += L(axis[0], top - 26, axis[0], top + gap * 2 + Z + 34, { c: C.thin, w: W.hair, dash: DASH.center });
  const engr = [
    // design plate: modular grid + circle + golden rectangles
    `<path d="M50 0V150M100 0V150M0 50H150M0 100H150" stroke="${C.faint}"/><circle cx="75" cy="75" r="46"/><rect x="28" y="28" width="94" height="94"/><path d="M75 29A46 46 0 0 1 121 75"/>`,
    // build plate: processor die with pins
    `<rect x="44" y="44" width="62" height="62"/><rect x="58" y="58" width="34" height="34" stroke="${C.ink}"/>` +
      [0, 1, 2, 3, 4].map(i => { const q = 52 + i * 11.5; return `<path d="M${q} 44V22M${q} 106V128M44 ${q}H22M106 ${q}H128"/><circle cx="${q}" cy="18" r="2.6"/><circle cx="${q}" cy="132" r="2.6"/><circle cx="18" cy="${q}" r="2.6"/><circle cx="132" cy="${q}" r="2.6"/>`; }).join(''),
    // run plate: orbit rings + crescent (it runs while you sleep)
    `<circle cx="75" cy="75" r="58" stroke-dasharray="4 5"/><circle cx="75" cy="75" r="40"/><path d="M84 52A24 24 0 1 0 98 86A19 19 0 1 1 84 52Z" fill="${C.line}" fill-opacity=".18"/>`,
  ];
  // bottom plate first, so upper plates occlude it
  for (let k = 2; k >= 0; k--) {
    const oy = top + k * gap;
    const A = iso(0, 0, 0, oy), B = iso(Z, 0, 0, oy), Cc = iso(Z, Z, 0, oy), D = iso(0, Z, 0, oy);
    const B2 = iso(Z, 0, -t, oy), C2 = iso(Z, Z, -t, oy), D2 = iso(0, Z, -t, oy);
    let g = '';
    g += `<path d="M${pts([D, Cc, C2, D2])}Z" fill="${C.sheetLo}" stroke="${C.ink}" stroke-width="${W.med}"/>`;
    g += `<path d="M${pts([D, Cc, C2, D2])}Z" fill="url(#h31)" opacity=".7"/>`;
    g += `<path d="M${pts([Cc, B, B2, C2])}Z" fill="${C.sheet}" stroke="${C.ink}" stroke-width="${W.med}"/>`;
    g += `<path d="M${pts([A, B, Cc, D])}Z" fill="#0f4177" stroke="${C.ink}" stroke-width="${W.thick}" stroke-linejoin="round"/>`;
    g += `<g transform="matrix(${COS} ${SIN} ${-COS} ${SIN} ${r2(A[0])} ${r2(A[1])})" fill="none" stroke="${C.line}" stroke-width="1.1">` +
      engr[k].replace(/<(path|rect|circle)/g, '<$1 vector-effect="non-scaling-stroke"') + '</g>';
    // outline once more on top for crisp edges
    g += `<path d="M${pts([A, B, B2, C2, D2, D])}Z" fill="none" stroke="${C.ink}" stroke-width="${W.thick}" stroke-linejoin="round"/>`;
    // balloon + label to the right corner
    const bx = box.x + box.w * 0.78, by = B[1] + 6;
    g += balloon(bx, by, String(k + 1), B[0] - 18, B[1] + 9);
    g += T(bx + 22, by + 3, labels[k], { size: 16, font: 'disp', fill: C.ink, ls: 1 });
    [].concat(subs[k] || []).forEach((t, j) => { g += T(bx + 22, by + 21 + j * 14, t, { size: 11, fill: C.muted, ls: 1 }); });
    s += `<g class="pl pl${k}">${g}</g>`;
  }
  // exploded-view alignment lines (phantom) from top plate corners to bottom
  const A0 = iso(0, 0, 0, top), D0 = iso(0, Z, 0, top), B0 = iso(Z, 0, 0, top);
  for (const q of [D0, B0]) s = L(q[0], q[1], q[0], q[1] + gap * 2, { c: C.faint, w: W.hair, dash: DASH.phantom }) + s;
  s = L(A0[0], A0[1] - 20, A0[0], A0[1] - 2, { c: C.faint, w: W.hair }) + s;
  s += T(box.x + box.w - 20, box.y + box.h - 6, 'ISOMETRIC  ·  EXPLODED ASSEMBLY', { size: 11, fill: C.muted, ls: 1.6, anchor: 'end' });
  if (p.tagline) {
    const tl = p.tagline.split('.')[0] + '.';
    s += redNote(box.x + 18, box.y + 22, tl, { size: 21, rot: -2 });
    s += redArrow(box.x + 120, box.y + 32, A0[0] - 70, A0[1] + 10, { bow: 0.25 });
  }
  css += `@keyframes pl1{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}@keyframes pl0{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}` +
    `.pl0{animation:pl0 6s cubic-bezier(.45,0,.55,1) infinite}.pl1{animation:pl1 6s cubic-bezier(.45,0,.55,1) infinite}`;
  return { svg: s, css };
}

// DÖSE: third-angle orthographic flacon. Top view above, side view right, front view in half section.
export function dose(box, p) {
  const feats = features(p.line).map(up);
  const fx = box.x + 330, base = box.y + box.h - 44;
  const bw = 150, bh = 168, dep = 82, cw = 70, chh = 54, colw = 34, colh = 11, wall = 9;
  const bodyTop = base - bh, colTop = bodyTop - colh, capTop = colTop - chh;
  const sx = fx + 192, tyc = box.y + 62; // side view centre x, top view centre y
  let s = '', defs = '', css = '';
  // projection lines (thin, faint) between views
  for (const y of [capTop, colTop, bodyTop, base]) s += L(fx + bw / 2 + 8, y, sx - dep / 2 - 8, y, { c: C.ghost, w: W.hair, dash: '3 4' });
  for (const x of [fx - bw / 2, fx + bw / 2, fx - cw / 2, fx + cw / 2]) s += L(x, tyc + dep / 2 + 8, x, capTop - 8, { c: C.ghost, w: W.hair, dash: '3 4' });
  // --- front view (left half in section) ---
  const body = `M${fx - bw / 2} ${bodyTop + 14}Q${fx - bw / 2} ${bodyTop} ${fx - bw / 2 + 14} ${bodyTop}H${fx + bw / 2 - 14}Q${fx + bw / 2} ${bodyTop} ${fx + bw / 2} ${bodyTop + 14}V${base}H${fx - bw / 2}Z`;
  const inner = `M${fx - bw / 2 + wall} ${bodyTop + wall + 10}Q${fx - bw / 2 + wall} ${bodyTop + wall} ${fx - bw / 2 + wall + 10} ${bodyTop + wall}H${fx + bw / 2 - wall - 10}Q${fx + bw / 2 - wall} ${bodyTop + wall} ${fx + bw / 2 - wall} ${bodyTop + wall + 10}V${base - wall * 2.2}H${fx - bw / 2 + wall}Z`;
  defs += `<clipPath id="lh"><rect x="${fx}" y="${capTop - 4}" width="${bw / 2 + 2}" height="${base - capTop + 8}"/></clipPath>` +
    `<clipPath id="liq"><path d="${inner}"/></clipPath>`;
  s += P(body, { c: 'none', fill: C.sheetLo, extra: 'fill-opacity=".55"' });
  // section hatch of the glass wall on the left half
  s += `<g clip-path="url(#lh)"><path d="${body} ${inner}" fill="url(#h32)" fill-rule="evenodd"/></g>`;
  // liquid: wave surface that moves, clipped to the inner cavity
  const ly = bodyTop + 48;
  let wave = `M${fx - bw} ${ly}`;
  for (let i = 0; i < 12; i++) wave += `q15 -5 30 0t30 0`;
  s += `<g clip-path="url(#liq)"><g class="wave"><path d="${wave}V${base}H${fx - bw}Z" fill="${C.line}" fill-opacity=".08"/><path d="${wave}" fill="none" stroke="${C.line}" stroke-width="${W.thin}"/></g></g>`;
  s += P(inner, { c: C.line, w: W.thin });
  s += P(body, { c: C.ink, w: W.thick });
  // label plate on the right half
  s += R(fx - 70, bodyTop + 66, 62, 36, { c: C.ink, w: W.med }) + T(fx - 39, bodyTop + 90, up(p.name), { size: 13, font: 'disp', fill: C.ink, anchor: 'middle' });
  // dip tube (hidden) + bubbles
  s += L(fx - 4, colTop, fx - 4, base - wall * 2.4, { c: C.line, w: W.thin, dash: DASH.hidden }) + L(fx + 4, colTop, fx + 4, base - wall * 2.4, { c: C.line, w: W.thin, dash: DASH.hidden });
  for (let i = 0; i < 4; i++) s += `<circle class="bub b${i}" cx="${fx}" cy="${base - 30}" r="${2 + (i % 2)}" fill="none" stroke="${C.line}" stroke-width=".9"/>`;
  // collar + cap
  s += R(fx - colw / 2, colTop, colw, colh, { c: C.ink, w: W.med, fill: C.sheet }) + R(fx - cw / 2, capTop, cw, chh, { c: C.ink, w: W.thick, fill: C.sheet, rx: 3 });
  s += `<g clip-path="url(#lh)">${R(fx - cw / 2, capTop, cw, chh, { fill: 'url(#h31)' })}</g>` + R(fx - cw / 2, capTop, cw, chh, { c: C.ink, w: W.thick, rx: 3 });
  s += L(fx, capTop - 16, fx, base + 14, { c: C.thin, w: W.hair, dash: DASH.center });
  s += T(fx, base + 30, 'FRONT  ·  HALF SECTION', { size: 10.5, fill: C.muted, anchor: 'middle', ls: 1.2 });
  // --- side view ---
  const sideBody = `M${sx - dep / 2} ${bodyTop + 10}Q${sx - dep / 2} ${bodyTop} ${sx - dep / 2 + 10} ${bodyTop}H${sx + dep / 2 - 10}Q${sx + dep / 2} ${bodyTop} ${sx + dep / 2} ${bodyTop + 10}V${base}H${sx - dep / 2}Z`;
  s += P(sideBody, { c: C.ink, w: W.thick, fill: C.sheetLo, extra: 'fill-opacity=".5"' }) + L(sx - dep / 2 + wall, bodyTop + wall, sx - dep / 2 + wall, base - wall * 2.2, { c: C.faint, w: W.hair, dash: DASH.hidden }) + L(sx + dep / 2 - wall, bodyTop + wall, sx + dep / 2 - wall, base - wall * 2.2, { c: C.faint, w: W.hair, dash: DASH.hidden });
  s += R(sx - colw / 2, colTop, colw, colh, { c: C.ink, w: W.med }) + R(sx - 27, capTop, 54, chh, { c: C.ink, w: W.thick, rx: 3 });
  s += L(sx, capTop - 16, sx, base + 14, { c: C.thin, w: W.hair, dash: DASH.center });
  s += T(sx, base + 30, 'RIGHT SIDE', { size: 10.5, fill: C.muted, anchor: 'middle', ls: 1.2 });
  // --- top view ---
  s += R(fx - bw / 2, tyc - dep / 2, bw, dep, { c: C.ink, w: W.thick, rx: 10 }) + R(fx - cw / 2, tyc - 27, cw, 54, { c: C.ink, w: W.med, rx: 3 });
  s += Ci(fx, tyc, colw / 2, { c: C.faint, w: W.hair, dash: DASH.hidden });
  s += L(fx - bw / 2 - 14, tyc, fx + bw / 2 + 14, tyc, { c: C.thin, w: W.hair, dash: DASH.center });
  s += T(fx + bw / 2 + 22, tyc + 4, 'TOP', { size: 10.5, fill: C.muted, ls: 1.2 });
  // dimensions carry the stack
  const st = p.stack.map(up);
  s += dimH(fx - bw / 2, fx + bw / 2, base + 52, st[0] || '', { y0: base, size: 11 });
  s += dimV(sx + dep / 2 + 30, capTop, base, st[1] || '', { x0: sx + 27, size: 11 });
  s += dimH(sx - dep / 2, sx + dep / 2, base + 52, st[2] || '', { y0: base, size: 10, ls: 0.4 });
  // feature callouts from the project line
      const anchors2 = [[fx - 64, bodyTop + 84], [fx - cw / 2 + 4, capTop + 22], [fx - 4, base - 46]];
  feats.slice(0, 3).forEach((f, i) => {
    const words = f.split(' '), half = Math.ceil(words.length / 2);
    const st2 = { size: 12.5, fill: C.ink, ls: 1.2 };
    const lines = f.length > 24 ? [{ t: words.slice(0, half).join(' '), ...st2 }, { t: words.slice(half).join(' '), ...st2 }] : [{ t: f, ...st2 }];
    s += callout(anchors2[i][0], anchors2[i][1], box.x + 214, [bodyTop + 4, capTop + 22, bodyTop + 120][i], lines, { lh: 17 });
  });
  s += redNote(box.x + 16, box.y + 26, p.redline ?? "founder's own house", { size: 21, rot: -3 });
  css += `@keyframes wave{to{transform:translateX(60px)}}.wave{animation:wave 5s linear infinite}` +
    `@keyframes bub{0%{transform:translateY(0);opacity:0}15%{opacity:.9}100%{transform:translateY(-${bh - 70}px);opacity:0}}` +
    [0, 1, 2, 3].map(i => `.b${i}{animation:bub 4.8s ${-i * 1.2}s ease-in infinite}`).join('');
  return { svg: s, css, defs };
}
