// More packages (BGA with lid, QFN, SOT-223) and the chip markings that carry repo data:
// part number = name prefix + date code (repo created), language line, firmware week (last push).
import { C, pad, text, fit, r1 } from './svg.mjs';
import { spread } from './parts.mjs';
import { dateCode } from './data.mjs';

// Part prefix: initials for multi-word names, first letter + last consonants for single words.
export function prefix(name) {
  const w = String(name).normalize('NFD').replace(/[^A-Za-z ]/g, '').toUpperCase().split(/\s+/).filter(Boolean);
  if (!w.length) return 'UXX';
  if (w.length > 1) {
    const ini = w.slice(0, 3).map(s => s[0]).join('');
    return (ini + (w[w.length - 1].slice(1).replace(/[AEIOU]/g, '') + 'X')).slice(0, 3);
  }
  const s = w[0], cons = s.slice(1).replace(/[AEIOUY]/g, '');
  return (s[0] + (cons.length >= 2 ? cons.slice(-2) : cons + s.slice(-1))).slice(0, 3);
}

const ABBR = { typescript: 'TS', javascript: 'JS', 'c#': 'C#', 'c++': 'C++', python: 'PY', html: 'HTML', css: 'CSS', 'jupyter notebook': 'IPYNB', astro: 'ASTRO', powershell: 'PS', shell: 'SH' };
// Primary language by bytes (name, colour) for a repo from data.json.
export function primary(repo) {
  const ls = [...(repo?.languages || [])].sort((a, b) => b.bytes - a.bytes);
  return ls[0] ? { name: ls[0].name, color: ls[0].color || C.dim, abbr: ABBR[ls[0].name.toLowerCase()] || ls[0].name.slice(0, 4).toUpperCase() } : null;
}

// Marking lines for a part.
export function marking(p, repo) {
  const lang = primary(repo);
  const es = /design/i.test(p.kind || '');
  return {
    pn: prefix(p.name) + (repo ? dateCode(repo.createdAt) : '----'),
    lang: lang ? lang.name.toUpperCase() : String(p.stack?.[0] || '').toUpperCase(),
    fw: es ? 'ES · ENGINEERING SAMPLE' : repo?.pushedAt ? `FW ${dateCode(repo.pushedAt)}` : '',
    color: lang?.color || C.dim,
  };
}

// Laser-etched marking block centred at (cx, cy) within width w.
export function etch(cx, cy, w, m, { ink = '#BDB7A8', dim = '#7E8079', logo = true, big = 26 } = {}) {
  const s = Math.floor(fit(m.pn, w - 36, big, 'D'));
  let g = '';
  if (logo) {
    g += `<rect x="${cx - 17}" y="${cy - s - 34}" width="34" height="22" rx="4" fill="none" stroke="${dim}" stroke-width="1.3"/>`;
    g += text(cx, cy - s - 18, 'AE', { size: 12, font: 'D', anchor: 'middle', fill: dim });
  }
  g += text(cx, cy, m.pn, { size: s, font: 'D', anchor: 'middle', fill: ink });
  g += text(cx, cy + 26, m.lang, { size: Math.min(16, fit(m.lang, w - 30, 16, 'M', 1.5)), ls: 1.5, anchor: 'middle', fill: dim });
  if (m.fw) g += text(cx, cy + 48, m.fw, { size: Math.min(14, fit(m.fw, w - 30, 14, 'M', 1.2)), ls: 1.2, anchor: 'middle', fill: dim });
  return g;
}

// Pin-1 marker in the repo's language colour (GitHub linguist colour).
export const pin1 = (x, y, col, r = 6) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${col}" opacity=".9"/><circle cx="${r1(x)}" cy="${r1(y)}" r="${r + 2.5}" fill="none" stroke="#000" stroke-opacity=".5"/>`;

// BGA: olive substrate, ball row peeking out, nickel heat-spreader lid, corner capacitors.
export function bga({ x, y, w, h, id = 'bg' }) {
  let g = `<linearGradient id="${id}n" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D9DCDA"/><stop offset=".5" stop-color="#9DA2A0"/><stop offset="1" stop-color="#C3C7C5"/></linearGradient>`;
  for (const px of spread(x + 12, x + w - 12, 14)) g += `<circle cx="${r1(px)}" cy="${y + h + 2}" r="4.5" fill="#A8A9A3"/><circle cx="${r1(px)}" cy="${y - 2}" r="4.5" fill="#A8A9A3"/>`;
  for (const py of spread(y + 12, y + h - 12, 14)) g += `<circle cx="${x - 2}" cy="${r1(py)}" r="4.5" fill="#A8A9A3"/><circle cx="${x + w + 2}" cy="${r1(py)}" r="4.5" fill="#A8A9A3"/>`;
  g += `<rect x="${x + 4}" y="${y + 6}" width="${w}" height="${h}" rx="6" fill="#000" opacity=".55"/>`;
  g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#1A2016" stroke="#334030" stroke-width="1.5"/>`;
  const m = 26, lw = w - 2 * m, lh = h - 2 * m;
  for (const [cx, cy, v] of [[x + 13, y + h / 2, 1], [x + w - 13, y + h / 2, 1], [x + w / 2, y + 13, 0], [x + w / 2, y + h - 13, 0]]) {
    g += v ? pad(cx - 4, cy - 16, 8, 8, 1) + pad(cx - 4, cy + 8, 8, 8, 1) + `<rect x="${cx - 4}" y="${cy - 8}" width="8" height="16" fill="#3A3226"/>`
      : pad(cx - 16, cy - 4, 8, 8, 1) + pad(cx + 8, cy - 4, 8, 8, 1) + `<rect x="${cx - 8}" y="${cy - 4}" width="16" height="8" fill="#3A3226"/>`;
  }
  g += `<path d="M${x + 6} ${y + 6}h14l-14 14z" fill="url(#au)"/>`;
  g += `<rect x="${x + m + 3}" y="${y + m + 4}" width="${lw}" height="${lh}" rx="10" fill="#000" opacity=".5"/>`;
  g += `<rect x="${x + m}" y="${y + m}" width="${lw}" height="${lh}" rx="10" fill="url(#${id}n)"/>`;
  g += `<rect x="${x + m + 6}" y="${y + m + 6}" width="${lw - 12}" height="${lh - 12}" rx="6" fill="none" stroke="#fff" stroke-opacity=".35"/>`;
  return { svg: g, lid: { x: x + m, y: y + m, w: lw, h: lh } };
}

// QFN: leadless body with pads flush at the edges.
export function qfn({ x, y, w, h, n = 5 }) {
  const pins = { L: [], R: [], T: [], B: [] }; let g = '';
  for (const p of spread(y + 16, y + h - 16, n)) { g += pad(x - 4, p - 3, 10, 6, 1) + pad(x + w - 6, p - 3, 10, 6, 1); pins.L.push({ x: x - 4, y: p }); pins.R.push({ x: x + w + 4, y: p }); }
  for (const p of spread(x + 16, x + w - 16, n)) { g += pad(p - 3, y - 4, 6, 10, 1) + pad(p - 3, y + h - 6, 6, 10, 1); pins.T.push({ x: p, y: y - 4 }); pins.B.push({ x: p, y: y + h + 4 }); }
  const svg = `${g}<rect x="${x + 3}" y="${y + 4}" width="${w}" height="${h}" rx="4" fill="#000" opacity=".5"/><rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="4" fill="url(#pkg)" stroke="${C.pkgEdge}" stroke-width="1.2"/>`;
  return { svg, pins };
}

// SOT-223: three leads below, one wide tab above.
export function sot({ x, y, w, h }) {
  let g = pad(x + w * 0.2, y - 16, w * 0.6, 19, 1.5);
  const pins = { B: [] };
  for (const p of spread(x + w * 0.2, x + w * 0.8, 3)) { g += pad(p - 5, y + h - 3, 10, 17, 1); pins.B.push({ x: p, y: y + h + 14 }); }
  const svg = `${g}<rect x="${x + 3}" y="${y + 4}" width="${w}" height="${h}" rx="3" fill="#000" opacity=".5"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="url(#pkg)" stroke="${C.pkgEdge}" stroke-width="1.2"/>`;
  return { svg, pins, tab: { x: x + w / 2, y: y - 16 } };
}
