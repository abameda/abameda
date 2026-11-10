// The diorama: a slab of Minya with the Nile along its front edge and every project as a building.
import { f, P as PAL, esc, monoW } from './svg.mjs';
import { cortex, ops, dose, attendance, bosla } from './buildings-a.mjs';
import { mnu, thread, printer, yosr, tree, palm, lamp, car, felucca } from './buildings-b.mjs';

export const LAYOUT = {
  X: 24, Y: 15, river: 13, avenue: [6.55, 7.85], street: [16.4, 17.6],
  b: {
    attendance: [0.8, 0.8], cortex: [7.0, 1.2], 'cortex-ops': [12.0, 2.2], bosla: [19.0, 1.2],
    'mnu-sms': [0.8, 8.0], dose: [5.4, 8.8], thread: [9.8, 9.3], printer: [13.2, 9.3], yosr: [18.4, 8.6],
  },
};

export function drawCity(I, { clock, keys = null }) {
  const { X, Y, river, avenue, street, b } = LAYOUT, P = I.P;
  let s = '';
  // slab strata (land part, then the lower river part)
  const strata = [[-1.7, 0.55, '#24173a'], [-1.15, 0.5, '#36234f'], [-0.65, 0.65, '#4c2f62']];
  for (const [z, h, c] of strata) s += I.box(0, 0, z, X, river, h, c, { top: false });
  for (const [z, h, c] of strata.slice(0, 2)) s += I.box(0, river, z, X, Y - river, h, c, { top: false });
  s += I.box(0, river, -0.65, X, Y - river, 0.3, '#2f4a86', { top: false });
  // land surface
  s += I.topFace(0, 0, 0, X, river, '#43305f');
  s += `<g transform="${I.mTop(0, 0, 0)}" opacity=".22">` + Array.from({ length: X - 1 }, (_, i) => `<line x1="${i + 1}" y1="0" x2="${i + 1}" y2="${river}" stroke="#8a72b8" stroke-width=".02"/>`).join('')
    + Array.from({ length: river - 1 }, (_, i) => `<line x1="0" y1="${i + 1}" x2="${X}" y2="${i + 1}" stroke="#8a72b8" stroke-width=".02"/>`).join('') + '</g>';
  // embankment wall facing the river, then water
  s += I.poly([P(0, river, 0), P(X, river, 0), P(X, river, -0.35), P(0, river, -0.35)], '#2a1c40');
  s += I.topFace(0, river, -0.35, X, Y - river, 'url(#water)');
  let gl = '';
  for (let i = 0; i < 26; i++) {
    const wx = 0.6 + ((i * 7.3) % (X - 1.2)), wy = river + 0.35 + ((i * 3.7) % 1.4);
    const [a, c] = P(wx, wy, -0.35);
    gl += `<rect x="${f(a)}" y="${f(c)}" width="${f(6 + (i % 4) * 4)}" height="1.4" rx=".7" fill="${i % 3 ? '#ffcf7a' : '#ff9d7a'}" class="glint" style="animation-delay:-${f((i * 0.37) % 4)}s"/>`;
  }
  s += gl;
  // roads
  s += I.topFace(0, avenue[0], 0.01, X, avenue[1] - avenue[0], '#261d40');
  s += I.topFace(street[0], 0, 0.012, street[1] - street[0], river, '#261d40');
  s += `<g transform="${I.mTop(0, (avenue[0] + avenue[1]) / 2, 0.02)}"><line x1=".3" y1="0" x2="${X - 0.3}" y2="0" stroke="#b49ae0" stroke-width=".05" stroke-dasharray=".45 .35" opacity=".55"/></g>`;
  s += `<g transform="${I.mTop((street[0] + street[1]) / 2, 0, 0.022)}"><line x1="0" y1=".3" x2="0" y2="${river - 0.3}" stroke="#b49ae0" stroke-width=".05" stroke-dasharray=".45 .35" opacity=".55"/></g>`;
  // crossing stripes
  s += `<g transform="${I.mTop(street[0], avenue[0] - 0.7, 0.025)}">` + [0, 1, 2, 3, 4].map(k => `<rect x="${0.1 + k * 0.22}" y="0" width=".12" height=".55" fill="#d8c8f5" opacity=".5"/>`).join('') + '</g>';
  // little park behind the boutique row
  s += I.topFace(9.6, 4.6, 0.015, 2.0, 1.6, '#2f5a52');

  // a project that is no longer in profile.json leaves a pocket park on its lot
  const pins = {}, put = (k, draw) => {
    if (keys && !keys.has(k)) { const [x, y] = b[k]; s += I.topFace(x, y, 0.015, 3.2, 3.2, '#2f5a52') + tree(I, x + 1, y + 1) + tree(I, x + 2.3, y + 2.1, 0.8); return; }
    const r = draw(); s += r.svg; pins[k] = r.pin;
  };
  // back row, far to near
  put('attendance', () => attendance(I, ...b.attendance, clock));
  s += tree(I, 6.2, 5.6) + tree(I, 6.3, 3.0, 0.9);
  put('cortex', () => cortex(I, ...b.cortex));
  s += tree(I, 10.2, 5.6, 0.8) + tree(I, 11.2, 5.2, 0.9);
  put('cortex-ops', () => ops(I, ...b['cortex-ops']));
  s += tree(I, 15.6, 3.2, 0.9) + tree(I, 15.6, 5.4, 0.8);
  put('bosla', () => bosla(I, ...b.bosla));
  // the avenue: lamps and traffic
  for (const lx of [2.2, 6.0, 10.4, 14.6, 19.0, 22.8]) s += lamp(I, lx, avenue[0] - 0.25);
  const dx = X * 0.866 * I.S, dy = X * 0.5 * I.S;
  s += `<style>@keyframes drive{0%{transform:translate(0,0);opacity:0}6%,92%{opacity:1}100%{transform:translate(${f(dx)}px,${f(dy)}px);opacity:0}}`
    + `@keyframes driveR{0%{transform:translate(${f(dx)}px,${f(dy)}px);opacity:0}8%,94%{opacity:1}100%{transform:translate(0,0);opacity:0}}`
    + `.car1{animation:drive 17s linear infinite}.car2{animation:driveR 21s linear infinite}</style>`;
  [['car1', 6.75, '#e8596c', -3], ['car1', 6.75, '#f0b44a', -11], ['car2', 7.15, '#8fd3e8', -6], ['car2', 7.15, '#d9d3f5', -15]].forEach(([c, ly, col, dl]) => {
    // resting position = where the animation is at t=0, so a frozen frame still has traffic spread out
    const ph = c === 'car1' ? -dl / 17 : 1 + dl / 21;
    s += `<g class="${c}" style="animation-delay:${dl}s" transform="translate(${f(dx * ph)},${f(dy * ph)})">${car(I, -0.9, ly, col)}</g>`;
  });
  // front row, far to near, with palms on the embankment
  put('mnu-sms', () => mnu(I, ...b['mnu-sms']));
  s += palm(I, 4.9, 12.6, 2.4);
  put('dose', () => dose(I, ...b.dose));
  s += palm(I, 9.3, 12.7, 2.8);
  put('thread', () => thread(I, ...b.thread));
  put('printer', () => printer(I, ...b.printer));
  s += lamp(I, 16.2, 12.5) + palm(I, 17.9, 12.7, 2.2);
  put('yosr', () => yosr(I, ...b.yosr));
  s += palm(I, 23.2, 12.6, 2.6) + tree(I, 23.0, 7.2 + 1.4, 0.8);
  // the Nile: a felucca drifting
  s += `<g class="drift">${felucca(I, 7.5, 14.1)}</g><g class="drift" style="animation-delay:-13s;animation-duration:31s">${felucca(I, 19.5, 14.3)}</g>`;
  return { svg: s, pins };
}

// Roof flags: a thin pole from a dot on the roof up to the label, so every number sits on its own
// building. The featured four carry short names; the rest carry their card number.
export const shortName = p => (p.name.length > 9 ? p.name.split(' ')[0] : p.name);
export function pinLabels(pins, projects, { featured = 4, flags = {}, size = 14 } = {}) {
  let s = '';
  projects.forEach((p, i) => {
    const pt = pins[p.key]; if (!pt) return;
    const [dx, dy] = flags[p.key] || [0, -32];
    const x = pt[0] + dx, y = pt[1] + dy, num = String(i + 1).padStart(2, '0'), ty = y + size * 0.36;
    s += `<line x1="${f(pt[0])}" y1="${f(pt[1])}" x2="${f(x)}" y2="${f(y + 13)}" stroke="${PAL.cream}" stroke-opacity=".75" stroke-width="1.2"/>`
      + `<circle cx="${f(pt[0])}" cy="${f(pt[1])}" r="3" fill="${PAL.cream}" stroke="#140c2c" stroke-width="1.2"/>`;
    if (i >= featured) {
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="13" fill="#140c2c" fill-opacity=".9" stroke="${PAL.cream}" stroke-opacity=".75" stroke-width="1.2"/>`
        + `<text x="${f(x)}" y="${f(ty)}" text-anchor="middle" class="m" font-size="${size}" fill="${PAL.cream}">${num}</text>`;
      return;
    }
    const name = shortName(p).toUpperCase(), nw = monoW(num, size, 0.4), tw = monoW(name, size, 1.4), w = nw + tw + 32, x0 = x - w / 2;
    s += `<rect x="${f(x0)}" y="${f(y - 13)}" width="${f(w)}" height="26" rx="13" fill="#140c2c" fill-opacity=".92" stroke="${PAL.cream}" stroke-opacity=".6" stroke-width="1.2"/>`
      + `<text x="${f(x0 + 12)}" y="${f(ty)}" class="m" font-size="${size}" fill="${PAL.coral}" letter-spacing=".4">${num}</text>`
      + `<text x="${f(x0 + 20 + nw)}" y="${f(ty)}" class="m" font-size="${size}" fill="${PAL.cream}" letter-spacing="1.4">${esc(name)}</text>`;
  });
  return s;
}
