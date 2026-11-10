#!/usr/bin/env node
// The Living Circuit: builds README.md + assets/*.svg from data.json and profile.json.
// Usage: node build.mjs <data.json> <profile.json> <outDir>
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { derive } from './lib/data.mjs';
import { readme } from './lib/readme.mjs';

const [dataPath, profilePath, outDir] = process.argv.slice(2);
if (!dataPath || !profilePath || !outDir) {
  console.error('usage: node build.mjs <data.json> <profile.json> <outDir>');
  process.exit(1);
}
const data = JSON.parse(readFileSync(dataPath, 'utf8'));
const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
const D = derive(data, profile);

const assets = join(outDir, 'assets');
mkdirSync(assets, { recursive: true });
for (const f of readdirSync(assets)) if (f.endsWith('.svg')) unlinkSync(join(assets, f));

const sizes = {};
const put = (name, svg) => { sizes[name] = Buffer.byteLength(svg); writeFileSync(join(assets, name), svg); };

writeFileSync(join(outDir, 'README.md'), readme(profile, D, put));

const total = Object.values(sizes).reduce((a, b) => a + b, 0);
const big = Object.entries(sizes).sort((a, b) => b[1] - a[1])[0];
console.log(`built README.md + ${Object.keys(sizes).length} svgs, ${(total / 1024).toFixed(0)} KB total (largest ${big[0]} ${(big[1] / 1024).toFixed(0)} KB)`);
