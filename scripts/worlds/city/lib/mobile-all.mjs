// Every phone composition, keyed by file name (m-<desktop name>). Call after the desktop SVGs are
// built: the iso engine numbers gradients globally, so building these first would renumber desktop ids.
// Each phone file then embeds only the glyphs it draws (lib/subset.mjs), which keeps the phone set light.
import { featuredM } from './mobile.mjs';
import { tileM, hoardingM, tileHeight } from './mobile-tiles.mjs';
import { heroM } from './mobile-hero.mjs';
import { activityM } from './mobile-census.mjs';
import { toolboxM } from './mobile-market.mjs';
import { hallM, stationM, stopNameSize } from './mobile-station.mjs';
import { inDesign } from './tiles.mjs';
import { subsetFonts } from './subset.mjs';

export function phoneFiles(data, profile, ordered, nFeatured) {
  const projects = ordered.projects, files = { 'm-hero.svg': heroM(data, ordered) };
  const tiles = projects.slice(nFeatured).filter(p => !inDesign(p)), th = tiles.length ? tileHeight(tiles, data) : 0;
  projects.forEach((p, i) => {
    files[`m-project-${p.key}.svg`] = i < nFeatured ? featuredM(p, i, data, ordered) : inDesign(p) ? hoardingM(p, i, data) : tileM(p, i, data, th);
  });
  files['m-toolbox.svg'] = toolboxM(data, profile);
  files['m-census.svg'] = activityM(data, projects);
  const links = Object.entries(profile.links), ns = stopNameSize(links);
  files['m-station-hall.svg'] = hallM(links.length);
  links.forEach(([k, u], i) => { files[`m-station-${k}.svg`] = stationM(k, u, i, links.length, ns); });
  for (const k of Object.keys(files)) files[k] = subsetFonts(files[k]);
  return files;
}
