#!/usr/bin/env node
// THE BLUEPRINT: generates README.md + assets/*.svg from data.json and profile.json.
// Usage: node build.mjs <data.json> <profile.json> <outDir>
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { hero } from './lib/hero.mjs';
import { readme } from './lib/readme.mjs';
import * as projects from './lib/projects.mjs';
import * as details from './lib/details.mjs';
import * as materials from './lib/materials.mjs';
import * as report from './lib/report.mjs';
import * as signoff from './lib/signoff.mjs';

const [dataPath, profilePath, outArg] = process.argv.slice(2);
if (!dataPath || !profilePath || !outArg) {
  console.error('usage: node build.mjs <data.json> <profile.json> <outDir>');
  process.exit(1);
}
const data = JSON.parse(readFileSync(dataPath, 'utf8'));
const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
const out = resolve(outArg), assets = join(out, 'assets');
mkdirSync(assets, { recursive: true });
for (const f of readdirSync(assets)) if (f.endsWith('.svg')) rmSync(join(assets, f));
// preview frames must never ship inside assets/
rmSync(join(assets, '.preview'), { recursive: true, force: true });

const ctx = { sheets: 5, files: {} };
const emit = (name, svg) => { writeFileSync(join(assets, name), svg); ctx.files[name] = Buffer.byteLength(svg); };

emit('hero.svg', hero(profile, data, ctx));

// sheet order = page order: 02 projects, 02 details, 03 materials, 04 test report, 05 sign-off
for (const s of [projects, details, materials, report, signoff]) s.build(profile, data, ctx, emit);

writeFileSync(join(out, 'README.md'), readme(profile, data, ctx));
const total = Object.values(ctx.files).reduce((a, b) => a + b, 0);
for (const [f, n] of Object.entries(ctx.files)) console.log(`${(n / 1024).toFixed(1).padStart(7)} KB  assets/${f}`);
console.log(`${(total / 1024).toFixed(1).padStart(7)} KB  total, README.md written to ${out}`);
