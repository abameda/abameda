// Per-file font subsetting for the phone SVGs (desktop files keep their full fonts). Each phone file
// embeds only the glyphs its own text uses: the woff2 is decoded (Brotli via zlib, the transformed
// glyf stream per the WOFF2 spec), unused glyphs are emptied while every glyph id stays put (so cmap,
// hmtx and maxp are reused unchanged), layout and hinting tables are dropped, and the result is
// written as a zlib-compressed WOFF 1.0. Node built-ins only; deterministic.
import { readFileSync } from 'node:fs';
import { brotliDecompressSync, deflateSync } from 'node:zlib';

const KNOWN = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB'];
const KEEP = new Set(['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'gasp']);

class Rd {
  constructor(b, o = 0) { this.b = b; this.o = o; }
  u8() { return this.b[this.o++]; }
  u16() { const v = this.b.readUInt16BE(this.o); this.o += 2; return v; }
  i16() { const v = this.b.readInt16BE(this.o); this.o += 2; return v; }
  u32() { const v = this.b.readUInt32BE(this.o); this.o += 4; return v; }
  b128() { let v = 0; for (let i = 0; i < 5; i++) { const c = this.u8(); v = v * 128 + (c & 127); if (!(c & 128)) return v; } throw new Error('bad UIntBase128'); }
  u255() { const c = this.u8(); return c === 253 ? this.u16() : c === 255 ? this.u8() + 253 : c === 254 ? this.u8() + 506 : c; }
}

function readWoff2(buf) {
  if (buf.toString('latin1', 0, 4) !== 'wOF2') throw new Error('not woff2');
  const r = new Rd(buf, 12), n = r.u16(); r.o = 20; const comp = r.u32(); r.o = 48;
  const dir = [];
  for (let i = 0; i < n; i++) {
    const fl = r.u8(), tag = (fl & 63) === 63 ? buf.toString('latin1', r.o, (r.o += 4)) : KNOWN[fl & 63];
    if (!tag) throw new Error('unknown table tag');
    const tv = fl >> 6, orig = r.b128(), tr = tag === 'glyf' || tag === 'loca' ? tv === 0 : tv !== 0;
    if (tr && tag !== 'glyf' && tag !== 'loca') throw new Error(`transformed ${tag} not supported`);
    dir.push({ tag, len: tr ? r.b128() : orig, tr });
  }
  const data = brotliDecompressSync(buf.subarray(r.o, r.o + comp)), t = {};
  let o = 0;
  for (const d of dir) { t[d.tag] = { buf: data.subarray(o, o + d.len), tr: d.tr }; o += d.len; }
  if (!t.glyf || !t.glyf.tr) throw new Error('expected a transformed glyf table');
  return t;
}

// The transformed glyf stream -> per glyph either null (empty), { simple } or { composite } records.
function decodeGlyf(b) {
  const h = new Rd(b, 2), flags = h.u16(), numGlyphs = h.u16(); h.u16();
  const sizes = Array.from({ length: 7 }, () => h.u32());
  let o = h.o; const [nC, nP, fl, gs, cs, bb, ins] = sizes.map(s => { const r = new Rd(b, o); o += s; return r; });
  const bmLen = 4 * Math.floor((numGlyphs + 31) / 32), bm = bb.b.subarray(bb.o, bb.o + bmLen); bb.o += bmLen;
  const hasBox = g => (bm[g >> 3] >> (7 - (g & 7))) & 1;
  const glyphs = [];
  for (let g = 0; g < numGlyphs; g++) {
    const nc = nC.i16();
    const box = hasBox(g) ? [bb.i16(), bb.i16(), bb.i16(), bb.i16()] : null;
    if (nc === 0) { glyphs.push(null); continue; }
    if (nc > 0) {
      const counts = Array.from({ length: nc }, () => nP.u255()), pts = [];
      let x = 0, y = 0;
      const total = counts.reduce((a, c) => a + c, 0), ws = (f, v) => (f & 1 ? v : -v);
      for (let i = 0; i < total; i++) {
        const raw = fl.u8(), on = !(raw >> 7), f = raw & 0x7f; let dx, dy;
        if (f < 10) { dx = 0; dy = ws(f, ((f & 14) << 7) + gs.u8()); }
        else if (f < 20) { dx = ws(f, (((f - 10) & 14) << 7) + gs.u8()); dy = 0; }
        else if (f < 84) { const b0 = f - 20, b1 = gs.u8(); dx = ws(f, 1 + (b0 & 0x30) + (b1 >> 4)); dy = ws(f >> 1, 1 + ((b0 & 0x0c) << 2) + (b1 & 0x0f)); }
        else if (f < 120) { const b0 = f - 84, a = gs.u8(), c = gs.u8(); dx = ws(f, 1 + (Math.floor(b0 / 12) << 8) + a); dy = ws(f >> 1, 1 + (((b0 % 12) >> 2) << 8) + c); }
        else if (f < 124) { const a = gs.u8(), b2 = gs.u8(), c = gs.u8(); dx = ws(f, (a << 4) + (b2 >> 4)); dy = ws(f >> 1, ((b2 & 0x0f) << 8) + c); }
        else { const a = gs.u16(), c = gs.u16(); dx = ws(f, a); dy = ws(f >> 1, c); }
        x += dx; y += dy; pts.push([x, y, on]);
      }
      ins.o += gs.u255();
      glyphs.push({ simple: { counts, pts, box } });
    } else {
      const start = cs.o, comps = []; let f, haveIns = false;
      do {
        f = cs.u16(); comps.push(cs.u16());
        cs.o += f & 1 ? 4 : 2;
        cs.o += f & 8 ? 2 : f & 0x40 ? 4 : f & 0x80 ? 8 : 0;
        if (f & 0x100) haveIns = true;
      } while (f & 0x20);
      if (haveIns) ins.o += gs.u255();
      if (!box) throw new Error('composite glyph without bbox');
      glyphs.push({ composite: { raw: Buffer.from(cs.b.subarray(start, cs.o)), comps, box } });
    }
  }
  if (flags & 1) { /* overlap bitmap: not needed for rendering */ }
  return glyphs;
}

// Standard glyf encoding, no hinting: int16 deltas, one flag byte per point.
function encodeGlyph(g) {
  if (g.simple) {
    const { counts, pts } = g.simple, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const box = g.simple.box || [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    const nP = pts.length, b = Buffer.alloc(10 + counts.length * 2 + 2 + nP * 5);
    let o = b.writeInt16BE(counts.length, 0);
    for (const v of box) o = b.writeInt16BE(v, o);
    let end = -1;
    for (const c of counts) { end += c; o = b.writeUInt16BE(end, o); }
    o = b.writeUInt16BE(0, o);
    for (const p of pts) b[o++] = p[2] ? 1 : 0;
    let px = 0; for (const p of pts) { o = b.writeInt16BE(p[0] - px, o); px = p[0]; }
    let py = 0; for (const p of pts) { o = b.writeInt16BE(p[1] - py, o); py = p[1]; }
    return b;
  }
  const { raw, box } = g.composite, head = Buffer.alloc(10);
  head.writeInt16BE(-1, 0); box.forEach((v, i) => head.writeInt16BE(v, 2 + i * 2));
  const body = Buffer.from(raw);
  for (let o = 0; o < body.length;) { // drop component instructions with the hinting
    const f = body.readUInt16BE(o) & ~0x100; body.writeUInt16BE(f, o);
    o += 4 + (f & 1 ? 4 : 2) + (f & 8 ? 2 : f & 0x40 ? 4 : f & 0x80 ? 8 : 0);
  }
  return Buffer.concat([head, body]);
}

const pad4 = b => (b.length % 4 ? Buffer.concat([b, Buffer.alloc(4 - (b.length % 4))]) : b);
const checksum = b => { const p = pad4(b); let s = 0; for (let i = 0; i < p.length; i += 4) s = (s + p.readUInt32BE(i)) >>> 0; return s; };

function cmapOf(b) {
  const r = new Rd(b, 2), n = r.u16(), map = new Map();
  for (let i = 0; i < n; i++) {
    r.u16(); r.u16(); const t = new Rd(b, r.u32());
    if (t.u16() !== 4) continue;
    t.o += 4; const segX2 = t.u16(); t.o += 6; const base = t.o, segs = segX2 / 2, roOff = base + segX2 * 3 + 2;
    for (let s = 0; s < segs; s++) {
      const end = b.readUInt16BE(base + s * 2), start = b.readUInt16BE(base + segX2 + 2 + s * 2), delta = b.readInt16BE(base + segX2 * 2 + 2 + s * 2), ro = b.readUInt16BE(roOff + s * 2);
      for (let c = start; c <= end && c !== 0xffff; c++) {
        let g = ro ? b.readUInt16BE(roOff + s * 2 + ro + (c - start) * 2) : c;
        if (g) g = (g + delta) & 0xffff;
        if (g && !map.has(c)) map.set(c, g);
      }
    }
  }
  return map;
}

const fonts = {};
function load(file) {
  if (!fonts[file]) { const t = readWoff2(readFileSync(file)); fonts[file] = { t, glyphs: decodeGlyf(t.glyf.buf), cmap: cmapOf(t.cmap.buf) }; }
  return fonts[file];
}

// WOFF 1.0 holding only the glyphs needed for `text` (plus .notdef and composite parts).
export function subsetWoff(file, text) {
  const { t, glyphs, cmap } = load(file), keep = new Set([0]);
  const add = g => { if (keep.has(g) || !glyphs[g]) { keep.add(g); return; } keep.add(g); if (glyphs[g].composite) glyphs[g].composite.comps.forEach(add); };
  for (const ch of new Set(text)) { const g = cmap.get(ch.codePointAt(0)); if (g) add(g); }
  const parts = [], loca = Buffer.alloc((glyphs.length + 1) * 4);
  let off = 0;
  glyphs.forEach((g, i) => { loca.writeUInt32BE(off, i * 4); if (g && keep.has(i)) { const e = pad4(encodeGlyph(g)); parts.push(e); off += e.length; } });
  loca.writeUInt32BE(off, glyphs.length * 4);
  const tabs = { glyf: Buffer.concat(parts), loca };
  for (const [tag, v] of Object.entries(t)) if (KEEP.has(tag)) tabs[tag] = Buffer.from(v.buf);
  tabs.head.writeUInt32BE(0, 8); tabs.head.writeInt16BE(1, 50); // checkSumAdjustment (set below), long loca
  tabs.post = Buffer.from(tabs.post.subarray(0, 32)); tabs.post.writeUInt32BE(0x00030000, 0); // no glyph names
  const tags = Object.keys(tabs).sort(), n = tags.length;
  // checkSumAdjustment over the equivalent sfnt
  const sfntHead = Buffer.alloc(12 + 16 * n), es = Math.floor(Math.log2(n));
  sfntHead.writeUInt32BE(0x00010000, 0); sfntHead.writeUInt16BE(n, 4); sfntHead.writeUInt16BE(16 << es, 6); sfntHead.writeUInt16BE(es, 8); sfntHead.writeUInt16BE(n * 16 - (16 << es), 10);
  let so = 12 + 16 * n, total = 0;
  const sums = tags.map(tag => checksum(tabs[tag])); // head's own checksum is taken with the adjustment at 0
  tags.forEach((tag, i) => { const b = tabs[tag]; sfntHead.write(tag, 12 + i * 16, 'latin1'); sfntHead.writeUInt32BE(sums[i], 16 + i * 16); sfntHead.writeUInt32BE(so, 20 + i * 16); sfntHead.writeUInt32BE(b.length, 24 + i * 16); so += pad4(b).length; total = (total + sums[i]) >>> 0; });
  tabs.head.writeUInt32BE((0xB1B0AFBA - ((total + checksum(sfntHead)) >>> 0)) >>> 0, 8);
  // WOFF 1.0 container
  const head = Buffer.alloc(44 + 20 * n), data = [];
  let wo = head.length;
  tags.forEach((tag, i) => {
    const b = tabs[tag], z = deflateSync(b, { level: 9 }), use = z.length < b.length ? z : b, e = 44 + i * 20;
    head.write(tag, e, 'latin1'); head.writeUInt32BE(wo, e + 4); head.writeUInt32BE(use.length, e + 8); head.writeUInt32BE(b.length, e + 12); head.writeUInt32BE(sums[i], e + 16);
    const p = pad4(use); data.push(p); wo += p.length;
  });
  head.write('wOFF', 0, 'latin1'); head.writeUInt32BE(0x00010000, 4); head.writeUInt32BE(wo, 8); head.writeUInt16BE(n, 12);
  head.writeUInt32BE(so, 16);
  return Buffer.concat([head, ...data]);
}

// Text that an SVG actually draws: the contents of its <text> elements, tags stripped, entities decoded.
export function drawnText(svg) {
  let s = ' ';
  for (const m of svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)) s += m[1].replace(/<[^>]*>/g, '');
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}

// Swap the full Latin faces embedded in a finished SVG for subsets of exactly what it draws.
// Any failure leaves the SVG as it was (full fonts), so a font problem can never break a build.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'fonts');
const FACES = { CityDisplay: 'bsd-800.woff2', CityMono: 'dmmono-500.woff2' };
export function subsetFonts(svg) {
  try {
    const text = drawnText(svg);
    return svg.replace(/(@font-face\{font-family:'(CityDisplay|CityMono)';[^}]*?src:url\()data:font\/woff2;base64,[A-Za-z0-9+/=]+\) format\('woff2'\)/g,
      (all, pre, fam) => `${pre}data:font/woff;base64,${subsetWoff(join(FONT_DIR, FACES[fam]), text).toString('base64')}) format('woff')`);
  } catch (e) {
    console.warn(`subset: kept full fonts (${e.message})`);
    return svg;
  }
}
