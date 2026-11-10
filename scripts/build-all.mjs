#!/usr/bin/env node
// Builds every world of the profile from live data.
// Usage (from the repo root): node scripts/build-all.mjs data.json profile.json
// The main world goes to the repo root (it's the profile README); the others go to worlds/<key>/.
// Each world's generator lives in scripts/worlds/<key>/build.mjs and has the same interface:
//   node build.mjs <data.json> <profile.json> <outDir>   -> writes <outDir>/README.md and <outDir>/assets/*.svg
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [dataPath = 'data.json', profilePath = 'profile.json'] = process.argv.slice(2);
const scripts = dirname(fileURLToPath(import.meta.url));
const root = resolve(scripts, '..');
const { login } = JSON.parse(readFileSync(profilePath, 'utf8'));

const WORLDS = [
  { key: 'city', name: 'The City', out: '.', url: `https://github.com/${login}` },
  { key: 'circuit', name: 'The Circuit Board', out: 'worlds/circuit', url: `https://github.com/${login}/${login}/tree/main/worlds/circuit#readme` },
  { key: 'blueprint', name: 'The Blueprint', out: 'worlds/blueprint', url: `https://github.com/${login}/${login}/tree/main/worlds/blueprint#readme` },
];

function switcher(current) {
  const items = WORLDS.map(w => (w.key === current ? `<b>${w.name}</b>` : `<a href="${w.url}">${w.name}</a>`));
  return `\n<p align="center">This profile exists in three worlds: ${items.join(' · ')}</p>\n`;
}

for (const w of WORLDS) {
  const out = join(root, w.out);
  const assets = join(out, 'assets');
  // Clear generated SVGs first, so a removed project doesn't leave a stale file behind.
  if (existsSync(assets)) for (const f of readdirSync(assets)) if (f.endsWith('.svg')) rmSync(join(assets, f));
  execFileSync(process.execPath, [join(scripts, 'worlds', w.key, 'build.mjs'), resolve(dataPath), resolve(profilePath), out], { stdio: ['ignore', 'ignore', 'inherit'] });
  const readme = join(out, 'README.md');
  writeFileSync(readme, readFileSync(readme, 'utf8').trimEnd() + '\n' + switcher(w.key));
  console.log(`built ${w.key} -> ${w.out}`);
}
