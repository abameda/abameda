#!/usr/bin/env node
// The City You Built: generates README.md + assets/*.svg from data.json and profile.json.
// Usage: node build.mjs <data.json> <profile.json> <outDir>
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { hero } from './lib/hero.mjs';
import { featured } from './lib/cards.mjs';
import { tile, hoarding, inDesign } from './lib/tiles.mjs';
import { toolbox } from './lib/toolbox.mjs';
import { activity } from './lib/activity.mjs';
import { station, hall } from './lib/contact.mjs';
import { readme } from './lib/readme.mjs';
import { phoneFiles } from './lib/mobile-all.mjs';

const [dataPath, profilePath, outDir] = process.argv.slice(2);
if (!dataPath || !profilePath || !outDir) {
  console.error('usage: node build.mjs <data.json> <profile.json> <outDir>');
  process.exit(1);
}
const data = JSON.parse(readFileSync(dataPath, 'utf8'));
const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
const assets = join(outDir, 'assets');
mkdirSync(assets, { recursive: true });
// start clean so renamed assets never linger, and never ship preview captures
for (const f of readdirSync(assets)) if (f.endsWith('.svg')) unlinkSync(join(assets, f));
if (existsSync(join(assets, '.preview'))) rmSync(join(assets, '.preview'), { recursive: true, force: true });

// The strongest four lead (in this order, when present); every other project keeps profile.json
// order. Numbers (01, 02, ...) follow this order everywhere: hero flags, postcards, tiles.
const LEAD = ['cortex', 'dose', 'attendance', 'bosla'];
const lead = LEAD.map(k => profile.projects.find(p => p.key === k)).filter(Boolean);
const projects = [...lead, ...profile.projects.filter(p => !LEAD.includes(p.key))];
const nFeatured = Math.min(4, projects.filter(p => !inDesign(p)).length);
const ordered = { ...profile, projects };

const files = {};
const h = hero(data, ordered);
files['hero.svg'] = h.svg;
projects.forEach((p, i) => {
  files[`project-${p.key}.svg`] = i < nFeatured ? featured(p, i, data, ordered) : inDesign(p) ? hoarding(p, i, data) : tile(p, i, data);
});
files['toolbox.svg'] = toolbox(data, profile);
files['census.svg'] = activity(data, projects);
const links = Object.entries(profile.links);
files['station-hall.svg'] = hall(links.length);
links.forEach(([k, u], i) => { files[`station-${k}.svg`] = station(k, u, i, links.length); });
// phone compositions (README serves them below 600px through <picture>); always after the desktop set
const phone = phoneFiles(data, profile, ordered, nFeatured);
Object.assign(files, phone);

let total = 0, phoneKB = 0;
for (const [name, svg] of Object.entries(files)) {
  writeFileSync(join(assets, name), svg);
  const kb = Buffer.byteLength(svg) / 1024;
  total += kb;
  if (name.startsWith('m-')) phoneKB += kb;
  if (kb > 340) console.warn(`warning: ${name} is ${kb.toFixed(0)} KB`);
}
writeFileSync(join(outDir, 'README.md'), readme(data, profile, projects, { featuredCount: nFeatured }));
console.log(`built ${Object.keys(files).length} svgs, ${total.toFixed(0)} KB (phone set ${Object.keys(phone).length} svgs, ${phoneKB.toFixed(0)} KB); hero windows ${h.windows.lit}/${h.windows.total}`);
