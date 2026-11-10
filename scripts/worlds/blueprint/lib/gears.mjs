// Spur gears that actually mesh: same module, centre distance = sum of pitch radii,
// phase solved so a tooth sits in the mating gap, speeds inversely proportional to tooth count.
import { C, W, DASH, r2, Ci, L, P } from './svg.mjs';

const rad = d => d * Math.PI / 180;
const pt = (r, a) => `${r2(r * Math.cos(rad(a)))} ${r2(r * Math.sin(rad(a)))}`;

export function gearOutline(N, m, phase = 0) {
  const p = 360 / N, rp = m * N / 2, ra = rp + m, rf = rp - 1.25 * m;
  const hf = p * 0.29, hp = p * 0.22, ha = p * 0.12;
  let d = '';
  for (let k = 0; k < N; k++) {
    const c = phase + k * p;
    d += (k === 0 ? 'M' : 'L') + pt(rf, c - hf);
    d += `Q${pt(rp * 0.985, c - hp * 1.08)} ${pt(rp, c - hp)}`;
    d += `L${pt(ra, c - ha)}A${r2(ra)} ${r2(ra)} 0 0 1 ${pt(ra, c + ha)}L${pt(rp, c + hp)}`;
    d += `Q${pt(rp * 0.985, c + hp * 1.08)} ${pt(rf, c + hf)}`;
    d += `A${r2(rf)} ${r2(rf)} 0 0 1 ${pt(rf, c + p - hf)}`;
  }
  return d + 'Z';
}

// Full gear drawing centred on (0,0): outline, pitch circle, web, holes, bore + keyway.
export function gearBody(N, m, phase, o = {}) {
  const rp = m * N / 2, rf = rp - 1.25 * m;
  const hub = Math.max(14, rp * 0.3), bore = Math.max(6, rp * 0.13);
  let s = P(gearOutline(N, m, phase), { c: C.ink, w: W.thick, fill: o.fill || 'none' });
  s += Ci(0, 0, rf - m * 1.4, { c: C.line, w: W.thin });
  s += Ci(0, 0, hub, { c: C.ink, w: W.med });
  const kw = bore * 0.5;
  s += P(`M${-kw / 2} ${-Math.sqrt(bore * bore - kw * kw / 4)}A${bore} ${bore} 0 1 0 ${kw / 2} ${-Math.sqrt(bore * bore - kw * kw / 4)}L${kw / 2} ${-bore - kw * 0.55}L${-kw / 2} ${-bore - kw * 0.55}Z`, { c: C.ink, w: W.med, fill: o.boreFill || 'none' });
  const holes = o.holes ?? (N >= 30 ? 6 : N >= 20 ? 4 : 0);
  if (holes) {
    const hr = (rf - m * 1.4 - hub) * 0.36, rr = (rf - m * 1.4 + hub) / 2;
    for (let i = 0; i < holes; i++) {
      const a = phase + 360 * i / holes + 180 / holes;
      s += Ci(rr * Math.cos(rad(a)), rr * Math.sin(rad(a)), hr, { c: C.line, w: W.med });
    }
    s += Ci(0, 0, rr, { c: C.faint, w: W.hair, dash: DASH.center });
  }
  s += Ci(0, 0, rp, { c: C.thin, w: W.hair, dash: DASH.center });
  return s;
}

// Lay out a train. gears: [{N, at:[x,y]} or {N, from: index, angle: deg}]. Returns parts + css.
export function gearTrain(gears, m, period, cls = 'gr') {
  const out = [];
  gears.forEach((g, i) => {
    const rp = m * g.N / 2;
    if (i === 0 || g.at) { out.push({ ...g, x: g.at[0], y: g.at[1], rp, phase: g.phase || 0, dir: 1, T: period }); return; }
    const a = out[g.from ?? i - 1];
    const dist = a.rp + rp, phi = g.angle;
    const x = a.x + dist * Math.cos(rad(phi)), y = a.y + dist * Math.sin(rad(phi));
    const pa = 360 / a.N, pb = 360 / g.N;
    let f = ((phi - a.phase) / pa) % 1; if (f < 0) f += 1;
    const phase = phi + 180 - pb * (0.5 - f);
    out.push({ ...g, x, y, rp, phase, dir: -a.dir, T: a.T * g.N / a.N });
  });
  let css = `@keyframes ${cls}cw{to{transform:rotate(360deg)}}@keyframes ${cls}ccw{to{transform:rotate(-360deg)}}`;
  const svg = out.map((g, i) => {
    css += `.${cls}${i}{transform-origin:0 0;animation:${cls}${g.dir > 0 ? 'cw' : 'ccw'} ${r2(g.T)}s linear infinite}`;
    const ext = g.rp + m * 2.2;
    return `<g transform="translate(${r2(g.x)} ${r2(g.y)})">` +
      L(-ext, 0, ext, 0, { c: C.thin, w: W.hair, dash: DASH.center }) + L(0, -ext, 0, ext, { c: C.thin, w: W.hair, dash: DASH.center }) +
      `<g class="spin ${cls}${i}">${gearBody(g.N, m, g.phase, g)}</g></g>`;
  }).join('');
  return { gears: out, svg, css };
}
