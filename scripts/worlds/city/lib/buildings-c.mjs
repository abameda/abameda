// The generic building for any project added to profile.json later: a parametric townhouse.
// Height follows the repo's code volume (log scale), the accent its primary language colour,
// so a new project gets a sensible building without anyone writing drawing code.
import { f, mix } from './svg.mjs';
import { W } from './buildings-a.mjs';

export function townhouseSpec(project, data) {
  const repo = (data.repos || []).find(r => project.repo && r.name.toLowerCase() === project.repo.toLowerCase());
  const bytes = repo ? repo.languages.reduce((a, l) => a + l.bytes, 0) : 0;
  const lang = repo && repo.languages[0];
  const h = Math.max(2.4, Math.min(6.4, 1.2 + Math.log10(bytes + 10) * 0.85));
  return { h, accent: (lang && lang.color) || '#ff7a6b' };
}

export function townhouse(I, x, y, { h = 4, accent = '#ff7a6b' } = {}) {
  const w = 3, d = 3, body = mix(accent, '#3a2a66', 0.55);
  let s = I.shadow(x, y, w, d, h + 1);
  s += I.box(x, y, 0, w, d, h, body);
  const rows = Math.max(1, Math.floor((h - 1.45) / 0.85));
  const win = { cols: 3, rows, u0: 0.32, v0: 0.4, du: 0.5, dv: 0.5, gu: 0.38, gv: 0.35, on: W };
  s += I.windows('left', x, y + d, h, win) + I.windows('right', x + w, y + d, h, win);
  // ground floor: lit shopfront on the shade face, door on the warm face
  s += `<g transform="${I.mLeft(x, y + d, 1.1)}"><rect x=".3" y=".18" width="2.4" height=".82" fill="#ffd58a" opacity=".9"/><rect x=".3" y=".05" width="2.4" height=".16" fill="${accent}"/></g>`;
  s += `<g transform="${I.mRight(x + w, y + d, 1.1)}"><rect x="1.15" y=".2" width=".7" height=".9" fill="#2a1d44"/><rect x="1.15" y=".2" width=".7" height=".1" fill="${accent}"/></g>`;
  // parapet and a rooftop water tank, the Minya skyline staple
  s += I.box(x - 0.08, y - 0.08, h, w + 0.16, d + 0.16, 0.18, mix(body, '#ffffff', 0.15));
  s += I.cyl(x + 0.9, y + 0.9, h + 0.18, h + 0.75, 0.38, '#b9bfe6');
  const [ax, ay] = I.P(x + 2.2, y + 2.2, h + 0.18), [bx, by] = I.P(x + 2.2, y + 2.2, h + 1.1);
  s += `<line x1="${f(ax)}" y1="${f(ay)}" x2="${f(bx)}" y2="${f(by)}" stroke="#d9dcf5" stroke-width="1"/><circle cx="${f(bx)}" cy="${f(by)}" r="2" fill="#ff5d6c" class="blink"/>`;
  return { svg: s, pin: I.P(x + w / 2, y + d / 2, h + 0.2) };
}
