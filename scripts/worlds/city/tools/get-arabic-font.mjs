#!/usr/bin/env node
// One-off: fetch an Arabic subset of a Google Font, limited to the glyphs the street plates use.
// Usage: node tools/get-arabic-font.mjs "<Family:wght@N>" "<text>" <out.woff2>
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
const [spec, text, out] = process.argv.slice(2);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(spec).replace(/%20/g, '+')}&text=${encodeURIComponent(text)}`;
const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
const m = css.match(/url\((https:[^)]+)\)\s*format\('woff2'\)/);
if (!m) { console.error(css.slice(0, 400)); process.exit(1); }
const buf = Buffer.from(await (await fetch(m[1], { headers: { 'User-Agent': UA } })).arrayBuffer());
mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, buf);
console.log(`${spec} -> ${out} (${(buf.length / 1024).toFixed(1)} KB)`);
