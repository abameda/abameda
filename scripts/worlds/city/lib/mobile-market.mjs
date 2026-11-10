// Phone Market Street: the same corner block (smaller, as the picture), its plate on a post, then a
// shop directory board where every tool is readable, and the live language meter as a bar + legend.
import { svgDoc, f, esc, P as PAL, tag, mix, monoW, monoFit, fmtNum } from './svg.mjs';
import { MOTION } from './motion.mjs';
import { marketBlock, NEON } from './toolbox.mjs';
import { meterSegs } from './meter.mjs';
import { postPlate } from './plate.mjs';
import { displayWidth } from './metrics.mjs';
import { SHARED_DEFS } from './scene.mjs';
import { MW, PAD, COL, cardBody } from './mobile.mjs';

const TS = 21, LH = 30, NAMEW = 172;

// Tools as lines of whole items joined by " · ", never splitting an item.
function itemLines(items, maxW, size, ls) {
  const out = []; let line = '';
  for (const it of items) {
    const t = line ? `${line} · ${it}` : it;
    if (line && monoW(t, size, ls) > maxW) { out.push(line); line = it; } else line = t;
  }
  if (line) out.push(line);
  return out;
}

export function toolboxM(data, profile) {
  const { s: block, I, Lx, Ly } = marketBlock(profile, { S: 15.5, cx: MW / 2, top: 26 });
  const [px, py] = I.P(Lx + 1.8 + 0.2, Ly - 2.2, 0);
  let s = block + postPlate(Math.min(px + 70, MW - 140), py + 66, 'market', { height: 118, en: 26, ar: 22 }).svg;
  const groups = Object.entries(profile.toolbox), tools = groups.reduce((a, [, v]) => a + v.length, 0);

  // shop directory: neon name on the left, gilt tool names on the right
  let y = py + 112;
  const top = y;
  let d = tag(PAD + 4, y + 40, 'SHOP DIRECTORY', { size: 19, fill: PAL.amber, ls: 2.2 })
    + tag(PAD + COL - 4, y + 40, `${groups.length} SHOPS · ${fmtNum(tools)} TOOLS`, { size: 17, fill: PAL.mute, ls: 1.2, anchor: 'end' });
  y += 62;
  groups.forEach(([k, v], i) => {
    const col = NEON[i % NEON.length], glow = mix(col, '#ffffff', 0.55), name = k.toUpperCase();
    const ns = Math.min(30, (30 * (NAMEW - 26)) / displayWidth(name, 30, 1));
    const lines = itemLines(v, COL - NAMEW - 8, TS, 0.3), rowH = Math.max(ns + 14, lines.length * LH + 12) + 18;
    d += `<line x1="${PAD + 4}" y1="${f(y)}" x2="${PAD + COL - 4}" y2="${f(y)}" stroke="#fff" stroke-opacity=".08"/>`;
    const ny = y + 18 + ns * 0.74;
    d += `<text x="${PAD + 4}" y="${f(ny)}" class="d" font-size="${f(ns)}" letter-spacing="1" fill="none" stroke="${col}" stroke-width="5" stroke-opacity=".28">${esc(name)}</text>`
      + `<text x="${PAD + 4}" y="${f(ny)}" class="d" font-size="${f(ns)}" letter-spacing="1" fill="${glow}" stroke="${col}" stroke-width=".8">${esc(name)}</text>`;
    lines.forEach((l, j) => { d += tag(PAD + NAMEW, y + 18 + 17 + j * LH, l, { size: TS, fill: '#ffe6b0', ls: 0.3 }); });
    y += rowH;
  });

  // the language meter, live from data.json
  const { langs, segs, sum } = meterSegs(data);
  if (langs.length) {
    y += 18;
    d += `<line x1="${PAD + 4}" y1="${f(y - 18)}" x2="${PAD + COL - 4}" y2="${f(y - 18)}" stroke="#fff" stroke-opacity=".08"/>`;
    d += tag(PAD + 4, y + 22, 'THE CITY RUNS ON', { size: 19, fill: PAL.cream, ls: 2.2 })
      + tag(PAD + COL - 4, y + 22, `${langs.length} ${langs.length === 1 ? 'LANGUAGE' : 'LANGUAGES'}, BY BYTES`, { size: 17, fill: PAL.mute, ls: 1, anchor: 'end' });
    const by = y + 42, bw = COL - 8;
    let cx = PAD + 4, bars = '';
    segs.forEach(sg => { const sw = (sg.share / sum) * bw; bars += `<rect x="${f(cx)}" y="${f(by)}" width="${f(Math.max(0, sw - 3))}" height="18" fill="${mix(sg.color || '#888888', '#1a1131', 0.12)}"/>`; cx += sw; });
    d += `<clipPath id="meterClipM"><rect x="${PAD + 4}" y="${f(by)}" width="${bw}" height="18" rx="9"/></clipPath><g clip-path="url(#meterClipM)">${bars}</g>`;
    const cw = bw / 2;
    segs.forEach((sg, i) => {
      const lx = PAD + 4 + (i % 2) * cw, ly = by + 60 + Math.floor(i / 2) * 36, text = `${sg.name.toUpperCase()} ${Math.max(1, Math.round(sg.share * 100))}%`;
      d += `<rect x="${f(lx)}" y="${f(ly - 15)}" width="14" height="14" rx="3" fill="${mix(sg.color || '#888888', '#1a1131', 0.12)}"/>`
        + tag(lx + 24, ly, text, { size: f(Math.min(19, monoFit(text, cw - 30, 19, 1))), fill: i === 0 ? PAL.cream : PAL.lav, ls: 1 });
    });
    y = by + 60 + Math.ceil(segs.length / 2) * 36 - 10;
  }
  y += 24;
  const board = `<rect x="${PAD - 12}" y="${f(top)}" width="${COL + 24}" height="${f(y - top)}" rx="12" fill="#140c2c" fill-opacity=".9" stroke="${PAL.cream}" stroke-opacity=".14"/>`;
  const Ht = Math.round(y + 26);

  const defs = `<clipPath id="frm"><rect width="${MW}" height="${Ht}" rx="24"/></clipPath>
<linearGradient id="bgm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#160d33"/><stop offset=".65" stop-color="#2a1550"/><stop offset="1" stop-color="#4a2160"/></linearGradient>
<radialGradient id="glm" cx=".5" cy=".3" r=".55"><stop offset="0" stop-color="#ff8a6b" stop-opacity=".3"/><stop offset="1" stop-color="#ff8a6b" stop-opacity="0"/></radialGradient>
<linearGradient id="shopWin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1f45"/><stop offset=".7" stop-color="#5a2a4a"/><stop offset="1" stop-color="#8a4048"/></linearGradient>${SHARED_DEFS}${I.defs}`;
  const css = MOTION + '.neonbad{animation:nb 14s ease-in-out infinite}@keyframes nb{0%,92.6%,100%{opacity:1}93.4%{opacity:.6}94.3%{opacity:1}}';
  const body = cardBody(MW, Ht, 'm', s + board + d);
  const alt = groups.map(([k, v]) => `${k}: ${v.join(', ')}`).join('; ');
  return svgDoc({ w: MW, h: Ht, title: 'Market Street: the toolbox', desc: alt, css, defs, body, fonts: { arabic: true } });
}
