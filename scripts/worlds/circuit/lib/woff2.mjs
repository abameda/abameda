// Minimal WOFF2 reader (Node built-ins only): Brotli via zlib, the transformed glyf stream,
// cmap format 4/12 and hmtx. Used at build time to turn text into glyph outlines, so no SVG
// depends on a web font loading (font races in SVG-as-img were the old failure mode).
import { readFileSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';

const TAGS = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];

class Rd {
  constructor(b, o = 0) { this.b = b; this.o = o; }
  u8() { return this.b[this.o++]; }
  u16() { const v = this.b.readUInt16BE(this.o); this.o += 2; return v; }
  i16() { const v = this.b.readInt16BE(this.o); this.o += 2; return v; }
  u32() { const v = this.b.readUInt32BE(this.o); this.o += 4; return v; }
  b128() { let v = 0; for (let i = 0; i < 5; i++) { const c = this.u8(); v = v * 128 + (c & 127); if (!(c & 128)) return v; } return v; }
  u255() { const c = this.u8(); return c === 253 ? this.u16() : c === 255 ? this.u8() + 253 : c === 254 ? this.u8() + 506 : c; }
}

function tables(buf) {
  const r = new Rd(buf, 12); const n = r.u16(); r.o = 20; const compLen = r.u32(); r.o = 48;
  const dir = [];
  for (let i = 0; i < n; i++) {
    const fl = r.u8(); const tag = (fl & 63) === 63 ? buf.toString('latin1', r.o, (r.o += 4)) : TAGS[fl & 63];
    const tv = fl >> 6; const orig = r.b128();
    const transformed = (tag === 'glyf' || tag === 'loca') ? tv === 0 : tv !== 0;
    dir.push({ tag, transformed, len: transformed ? r.b128() : orig });
  }
  const data = brotliDecompressSync(buf.subarray(r.o, r.o + compLen));
  const out = {}; let o = 0;
  for (const t of dir) { out[t.tag] = { buf: data.subarray(o, o + t.len), transformed: t.transformed }; o += t.len; }
  return out;
}

function parseCmap(b) {
  const r = new Rd(b, 2); const n = r.u16(); const map = new Map();
  const subs = [];
  for (let i = 0; i < n; i++) subs.push({ pid: r.u16(), eid: r.u16(), off: r.u32() });
  for (const s of subs) {
    const t = new Rd(b, s.off); const fmt = t.u16();
    if (fmt === 4) {
      t.o += 4; const segX2 = t.u16(); t.o += 6; const segs = segX2 / 2;
      const base = t.o, end = i => b.readUInt16BE(base + i * 2), start = i => b.readUInt16BE(base + segX2 + 2 + i * 2);
      const delta = i => b.readInt16BE(base + segX2 * 2 + 2 + i * 2), roOff = base + segX2 * 3 + 2, ro = i => b.readUInt16BE(roOff + i * 2);
      for (let i = 0; i < segs; i++) for (let c = start(i); c <= end(i) && c !== 0xffff; c++) {
        let g;
        if (!ro(i)) g = (c + delta(i)) & 0xffff;
        else { const a = roOff + i * 2 + ro(i) + (c - start(i)) * 2; g = b.readUInt16BE(a); if (g) g = (g + delta(i)) & 0xffff; }
        if (g && !map.has(c)) map.set(c, g);
      }
    } else if (fmt === 12) {
      t.o += 10; const ng = t.u32();
      for (let i = 0; i < ng; i++) { const s0 = t.u32(), e0 = t.u32(), g0 = t.u32(); for (let c = s0; c <= e0; c++) if (!map.has(c)) map.set(c, g0 + c - s0); }
    }
  }
  return map;
}

// Point triplet decoding from the WOFF2 spec (section 5.2).
function triplets(flags, r, n) {
  const pts = []; let x = 0, y = 0;
  const ws = (f, v) => (f & 1 ? v : -v);
  for (let i = 0; i < n; i++) {
    const raw = flags.u8(); const on = !(raw >> 7); const f = raw & 0x7f; let dx, dy;
    if (f < 10) { dx = 0; dy = ws(f, ((f & 14) << 7) + r.u8()); }
    else if (f < 20) { dx = ws(f, (((f - 10) & 14) << 7) + r.u8()); dy = 0; }
    else if (f < 84) { const b0 = f - 20, b1 = r.u8(); dx = ws(f, 1 + (b0 & 0x30) + (b1 >> 4)); dy = ws(f >> 1, 1 + ((b0 & 0x0c) << 2) + (b1 & 0x0f)); }
    else if (f < 120) { const b0 = f - 84, a = r.u8(), c = r.u8(); dx = ws(f, 1 + (Math.floor(b0 / 12) << 8) + a); dy = ws(f >> 1, 1 + (((b0 % 12) >> 2) << 8) + c); }
    else if (f < 124) { const a = r.u8(), b2 = r.u8(), c = r.u8(); dx = ws(f, (a << 4) + (b2 >> 4)); dy = ws(f >> 1, ((b2 & 0x0f) << 8) + c); }
    else { const a = r.u16(), c = r.u16(); dx = ws(f, a); dy = ws(f >> 1, c); }
    x += dx; y += dy; pts.push({ x, y, on });
  }
  return pts;
}

// Decodes the transformed glyf table into { contours } (simple) or { comps } (composite) per glyph.
function parseGlyf(b) {
  const h = new Rd(b, 4); const numGlyphs = h.u16(); h.u16();
  const sizes = Array.from({ length: 7 }, () => h.u32());
  let o = h.o; const st = sizes.map(s => { const r = new Rd(b, o); o += s; return r; });
  const [nC, nP, fl, gs, cs, , ins] = st;
  const glyphs = [];
  for (let g = 0; g < numGlyphs; g++) {
    const nc = nC.i16();
    if (nc === 0) { glyphs.push({ contours: [] }); continue; }
    if (nc > 0) {
      const counts = Array.from({ length: nc }, () => nP.u255());
      const all = triplets(fl, gs, counts.reduce((a, c) => a + c, 0));
      ins.o += gs.u255();
      const contours = []; let k = 0;
      for (const c of counts) { contours.push(all.slice(k, k + c)); k += c; }
      glyphs.push({ contours });
    } else {
      const comps = []; let flags, haveIns = false;
      do {
        flags = cs.u16(); const gid = cs.u16(); let dx, dy;
        if (flags & 1) { dx = cs.i16(); dy = cs.i16(); } else { dx = (cs.u8() << 24) >> 24; dy = (cs.u8() << 24) >> 24; }
        let m = [1, 0, 0, 1]; const f2 = () => cs.i16() / 16384;
        if (flags & 8) { const s = f2(); m = [s, 0, 0, s]; }
        else if (flags & 0x40) m = [f2(), 0, 0, f2()];
        else if (flags & 0x80) m = [f2(), f2(), f2(), f2()];
        if (flags & 0x100) haveIns = true;
        comps.push({ gid, dx, dy, m });
      } while (flags & 0x20);
      if (haveIns) ins.o += gs.u255();
      glyphs.push({ comps });
    }
  }
  return glyphs;
}

function contourD(pts) {
  const n = pts.length; if (n < 2) return '';
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, on: true });
  let s = pts.findIndex(p => p.on); let seq;
  if (s < 0) { seq = [mid(pts[0], pts[1]), ...pts.slice(1), pts[0]]; }
  else seq = [...pts.slice(s), ...pts.slice(0, s)];
  const P = p => `${Math.round(p.x)} ${Math.round(-p.y)}`;
  let d = 'M' + P(seq[0]); let ctrl = null;
  for (let k = 1; k <= seq.length; k++) {
    const p = seq[k % seq.length];
    if (p.on) { d += ctrl ? `Q${P(ctrl)} ${P(p)}` : `L${P(p)}`; ctrl = null; }
    else { if (ctrl) { const m = mid(ctrl, p); d += `Q${P(ctrl)} ${P(m)}`; } ctrl = p; }
  }
  return d + 'Z';
}

export function loadFont(file) {
  const t = tables(readFileSync(file));
  const head = t.head.buf, hhea = t.hhea.buf, hmtx = t.hmtx.buf;
  const upm = head.readUInt16BE(18);
  const nh = hhea.readUInt16BE(34);
  const glyphs = parseGlyf(t.glyf.buf);
  const advs = [];
  for (let i = 0; i < nh; i++) advs.push(hmtx.readUInt16BE(i * 4));
  const cmap = parseCmap(t.cmap.buf);
  const flat = gid => {
    const g = glyphs[gid]; if (!g) return [];
    if (g.contours) return g.contours;
    return g.comps.flatMap(c => flat(c.gid).map(ct => ct.map(p => ({ x: c.m[0] * p.x + c.m[2] * p.y + c.dx, y: c.m[1] * p.x + c.m[3] * p.y + c.dy, on: p.on }))));
  };
  const cache = new Map();
  return {
    upm,
    ascent: hhea.readInt16BE(4), descent: hhea.readInt16BE(6),
    gid: cp => cmap.get(cp),
    adv: gid => advs[Math.min(gid, nh - 1)],
    path: gid => { if (!cache.has(gid)) cache.set(gid, flat(gid).map(contourD).join('')); return cache.get(gid); },
  };
}
