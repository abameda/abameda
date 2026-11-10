// Detail drawings for the secondary projects. Each draws into a 332x134 area at (x,y) and
// takes its labels from the project's own line/stack in profile.json.
import { C, W, T, L, R, P, Ci, DASH, r2, up, dimH, dimV } from './svg.mjs';
import { callout } from './parts.mjs';
import { features } from './data.mjs';

const ink = () => ({ c: C.ink, w: W.med }), thin = () => ({ c: C.line, w: W.thin });
const LBL = () => ({ size: 11.5, fill: C.ink, ls: 0.8 });
// split a label into two lines when it would run past `max` characters
const two = (s, max = 17) => {
  if (s.length <= max) return [{ ...LBL(), t: s }];
  const w = s.split(' '), k = Math.max(1, Math.ceil(w.length / 2));
  return [{ ...LBL(), t: w.slice(0, k).join(' ') }, { ...LBL(), t: w.slice(k).join(' ') }];
};
const ball = (x, y, n) => Ci(x, y, 8, { c: C.ink, w: W.med, fill: C.sheet }) + T(x, y + 3.6, n, { size: 10, fill: C.ink, anchor: 'middle' });
const stamp = (x, y, word) => { const w = word.length * 9.6 + 22; return `<g transform="rotate(-7 ${x} ${y})" opacity=".92">${R(x - w / 2, y - 12, w, 24, { c: C.red, w: 2, rx: 3 })}${T(x, y + 4.5, word, { size: 12, font: 'disp', fill: C.red, anchor: 'middle', ls: 0.8 })}</g>`; };

// CORTEX OPS: console front view; callouts are what the dashboard sits behind.
function ops(x, y, p) {
  const m = p.line.match(/behind\s+(.+?)\.?$/i), parts = (m ? m[1].split(/,\s*|\s+and\s+/) : [p.kind]).map(up).slice(0, 2);
  let s = R(x + 6, y + 10, 150, 110, { ...ink(), w: W.thick, rx: 6, fill: C.sheetLo }) + R(x + 18, y + 22, 126, 58, { ...thin(), rx: 3 });
  s += `<path class="trace" d="M${x + 22} ${y + 64}l13 -8 10 10 12 -26 13 16 10 -6 13 12 12 -20 13 8 12 -4" fill="none" stroke="${C.red}" stroke-width="1.6" stroke-linejoin="round"/>`;
  for (let i = 0; i < 3; i++) { const dx = x + 38 + i * 43; s += Ci(dx, y + 100, 9, ink()) + L(dx, y + 100, dx + 6 * Math.cos(i + 1), y + 100 - 6 * Math.sin(i + 1), ink()); }
  s += L(x + 81, y + 2, x + 81, y + 130, { c: C.thin, w: W.hair, dash: DASH.center });
  const pts = [[x + 132, y + 36], [x + 124, y + 100]];
  parts.forEach((t, i) => { s += callout(pts[i][0], pts[i][1], x + 186, y + 34 + i * 62, two(t), { lh: 15, shoulder: 14 }); });
  return s;
}

// THREAD: cameras converge on a garment mesh (photogrammetry).
function thread(x, y, p) {
  const cx = x + 92, cy = y + 66;
  const shirt = `M${cx - 22} ${cy - 46}Q${cx} ${cy - 36} ${cx + 22} ${cy - 46}L${cx + 52} ${cy - 30}L${cx + 40} ${cy - 6}L${cx + 30} ${cy - 12}V${cy + 46}H${cx - 30}V${cy - 12}L${cx - 40} ${cy - 6}L${cx - 52} ${cy - 30}Z`;
  let s = `<clipPath id="sh"><path d="${shirt}"/></clipPath><g clip-path="url(#sh)" stroke="${C.faint}" stroke-width=".8">`;
  for (let i = -6; i <= 6; i++) s += `<line x1="${cx + i * 14 - 60}" y1="${cy - 60}" x2="${cx + i * 14 + 60}" y2="${cy + 60}"/><line x1="${cx + i * 14 + 60}" y1="${cy - 60}" x2="${cx + i * 14 - 60}" y2="${cy + 60}"/>`;
  s += `</g>` + P(shirt, { c: C.ink, w: W.thick });
  const cams = [[-78, -40, 18], [76, -46, -20], [-80, 40, -14], [74, 44, 16]];
  cams.forEach(([dx, dy, rot]) => {
    const px = cx + dx, py = cy + dy, dir = dx < 0 ? 1 : -1;
    s += `<g transform="rotate(${rot} ${px} ${py})">` + R(px - 9, py - 6, 18, 12, { ...ink(), fill: C.sheet }) + P(`M${px + dir * 9} ${py - 4}L${px + dir * 20} ${py - 9}V${py + 9}L${px + dir * 9} ${py + 4}`, ink()) + '</g>';
    s += L(px + dir * 22, py, cx - dir * 6, cy, { c: C.faint, w: W.hair, dash: '3 3' });
  });
  const labels = [/photo/i.test(p.line) && ['PHOTOS IN', cx + 86, cy - 46], [up(p.stack.at(-1) || '3D MESH'), cx + 26, cy + 18]].filter(Boolean);
  labels.forEach(([t, px, py], i) => { s += callout(px, py, x + 204, y + 30 + i * 64, two(t, 15), { lh: 15, shoulder: 12 }); });
  return s;
}

// MNU SMS: records cabinet; one drawer per thing the system keeps, the second one pulled out.
function sms(x, y, p) {
  const items = features(p.line).map(up).slice(0, 4), n = Math.max(1, items.length), dh = Math.min(28, 112 / n);
  const cx0 = x + 56, cw = 220, top = y + 66 - (n * dh + 10) / 2;
  let s = R(cx0, top, cw, n * dh + 10, { ...ink(), w: W.thick, fill: C.sheetLo });
  s += L(cx0 + cw / 2, top - 8, cx0 + cw / 2, top + n * dh + 18, { c: C.thin, w: W.hair, dash: DASH.center });
  items.forEach((t, i) => {
    const dy = top + 5 + i * dh, out = i === 1;
    let d = R(cx0 + 6, dy, cw - 12, dh - 4, { ...thin(), fill: out ? C.sheet : 'none' }) + R(cx0 + 24, dy + 4, 150, dh - 12, { c: C.ink, w: W.hair, fill: C.sheet }) +
      T(cx0 + 99, dy + dh / 2 + 2, t, { size: 10.5, fill: C.ink, anchor: 'middle', ls: 0.6, tl: t.length * 7 > 140 ? 140 : null }) + R(cx0 + 184, dy + dh / 2 - 5, 22, 6, { ...ink(), rx: 3 });
    if (out) { s += R(cx0 + 6, dy, cw - 12, dh - 4, { c: C.faint, w: W.hair, dash: DASH.hidden }); d = `<g class="dr">${d}</g>`; }
    s += d;
  });
  return s + T(cx0 + cw + 12, top + 12, `${items.length}`, { size: 22, font: 'disp', fill: C.ink }) + T(cx0 + cw + 12, top + 28, 'DRAWERS', { size: 10.5, fill: C.muted, ls: 0.8 });
}

// PRINTER: ticket printer in section; balloons on the parts, numbered list from the project line.
function printer(x, y, p) {
  const items = features(p.line).map(up).slice(0, 4);
  let s = R(x + 8, y + 46, 140, 70, { c: C.ink, w: W.thick, rx: 8, fill: C.sheetLo });
  s += `<clipPath id="pc"><rect x="${x + 8}" y="${y + 46}" width="140" height="70" rx="8"/></clipPath><g clip-path="url(#pc)">${R(x + 8, y + 46, 140, 70, { fill: 'url(#h31)' })}</g>`;
  s += Ci(x + 56, y + 82, 26, { ...ink(), fill: C.sheet }) + Ci(x + 56, y + 82, 9, ink()) + Ci(x + 56, y + 82, 18, { c: C.faint, w: W.hair, dash: DASH.hidden });
  s += P(`M${x + 56} ${y + 56}H${x + 118}L${x + 124} ${y + 46}`, thin());
  s += R(x + 96, y + 92, 34, 16, { ...ink(), fill: C.sheet }) + [0, 1, 2, 3].map(i => L(x + 101 + i * 8, y + 108, x + 101 + i * 8, y + 112, thin())).join('');
  s += `<g class="tk">${R(x + 108, y + 8, 34, 38, { ...ink(), fill: C.sheet })}${L(x + 114, y + 18, x + 136, y + 18, { c: C.faint, w: W.hair })}${L(x + 114, y + 26, x + 132, y + 26, { c: C.faint, w: W.hair })}</g>`;
  s += dimV(x + 156, y + 8, y + 46, '', { x0: x + 142 });
  s += R(x + 20, y + 116, 116, 6, { c: C.ink, w: W.thin, fill: C.sheet });
  s += L(x + 8, y + 129, x + 148, y + 129, { c: C.ink, w: W.med }) + [0, 1, 2, 3, 4].map(i => L(x + 8 + i * 35, y + 125, x + 8 + i * 35, y + 129, ink())).join('');
  const marks = [[x + 113, y + 78], [x + 170, y + 27], [x + 146, y + 110], [x + 162, y + 127]];
  items.forEach((t, i) => {
    if (!marks[i]) return;
    s += ball(marks[i][0], marks[i][1], i + 1) + ball(x + 196, y + 18 + i * 32, i + 1);
    s += T(x + 210, y + 22 + i * 32, t, { size: 11, fill: C.ink, ls: 0.4, tl: t.length * 7 > 150 ? 150 : null });
  });
  return s;
}

// YOSR: doc-first design, stacked documents titled from the project line, IN DESIGN stamp.
function yosr(x, y, p) {
  const docs = features(p.line).map(f => up(f.replace(/\s+before\s+.*$/i, ''))).slice(0, 3).reverse();
  let s = '';
  docs.forEach((t, i) => {
    const dx = x + 36 + i * 22, dy = y + 4 + i * 20, front = i === docs.length - 1;
    s += P(`M${dx} ${dy}H${dx + 142}L${dx + 156} ${dy + 14}V${dy + 86}H${dx}Z`, { ...ink(), fill: C.sheet }) + P(`M${dx + 142} ${dy}V${dy + 14}H${dx + 156}`, thin());
    s += T(dx + 10, dy + (front ? 26 : 15), t, { size: front ? 11.5 : 9.5, fill: front ? C.ink : C.muted, ls: 0.6, tl: t.length * (front ? 7.5 : 6.3) > 130 ? 130 : null });
    if (front) for (let k = 0; k < 4; k++) s += L(dx + 10, dy + 42 + k * 11, dx + (k === 3 ? 80 : 140), dy + 42 + k * 11, { c: C.faint, w: W.hair });
  });
  s += `<g transform="rotate(-38 ${x + 252} ${y + 110})">${R(x + 214, y + 104, 66, 12, { ...ink(), fill: C.sheetLo })}${P(`M${x + 214} ${y + 104}L${x + 200} ${y + 110}L${x + 214} ${y + 116}`, ink())}</g>`;
  if (/design/i.test(p.kind)) s += stamp(x + 276, y + 22, 'IN DESIGN');
  return s;
}

// PLAN CHEST: the flat-file drawer where every drawing is kept (all repositories).
function chest(x, y, p, n) {
  let s = R(x + 76, y + 22, 180, 104, { c: C.ink, w: W.thick, fill: C.sheetLo });
  for (let i = 0; i < 4; i++) {
    const dy = y + 30 + i * 24, open = i === 1 ? -14 : 0;
    s += R(x + 84 + open, dy, 164, 20, { ...thin(), fill: i === 1 ? C.sheet : 'none' }) + R(x + 152 + open, dy + 7, 28, 6, { ...thin(), rx: 3 });
  }
  s += P(`M${x + 80} ${y + 54}l14 -18h120l-14 18`, { c: C.line, w: W.hair, dash: '2 3' });
  return s + T(x + 166, y + 12, `${n} DRAWINGS FILED`, { size: 11, fill: C.muted, anchor: 'middle', ls: 1.2 });
}

// Fallback for a project with no drawing of its own: an angle bracket, dimensioned with its stack.
function part(x, y, p) {
  const bx = x + 96;
  let s = P(`M${bx} ${y + 16}V${y + 112}H${bx + 140}V${y + 92}H${bx + 20}V${y + 16}Z`, { c: C.ink, w: W.thick, fill: C.sheetLo });
  s += Ci(bx + 10, y + 40, 5, ink()) + Ci(bx + 10, y + 70, 5, ink()) + Ci(bx + 80, y + 102, 5, ink()) + Ci(bx + 120, y + 102, 5, ink());
  return s + dimH(bx, bx + 140, y + 128, up(p.stack[0] || p.kind), { y0: y + 112, size: 11 });
}

export const ICONS = { 'cortex-ops': ops, thread, 'mnu-sms': sms, printer, yosr, chest, part };
export const ICON_CSS = `@keyframes trace{from{stroke-dashoffset:0}to{stroke-dashoffset:-260}}.trace{stroke-dasharray:180 80;animation:trace 4s linear infinite}` +
  `@keyframes tk{0%,60%{transform:translate(0,0)}80%,100%{transform:translate(0,-6px)}}.tk{animation:tk 5s cubic-bezier(.5,0,.3,1) infinite alternate}` +
  `@keyframes dr{0%,40%{transform:translateX(0)}70%,100%{transform:translateX(-16px)}}.dr{animation:dr 6s cubic-bezier(.5,0,.3,1) infinite alternate}`;
