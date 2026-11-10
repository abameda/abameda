# The Living Circuit

**Idea.** The whole profile is one matte-black PCB, sliced into images that meet with no gaps. U1 is decapped: a window in the package shows the silicon die with his name etched on it at 78 units, and 72 gold bond wires run out to the lead frame, with a cyan glow that travels around them. U1's bottom pins fan out to his real facts (the pin assignment). Its side pins become a six-line bus that runs down every slice. Current flows through the bus with one pattern for the whole page, offset by each slice's global y, so a pulse leaving one image comes in at the top of the next. Each section is a dashed functional block with a BLOCK 0N tab, as on a real board: 01 CPU, 02 PLACED PARTS, 03 BILL OF MATERIALS, 04 LOGIC ANALYZER, 05 I/O.

**Live data (data.json).** Hero: REV date, the D1 "LAST PUSH n DAYS AGO" line with the repo and date, and "On GitHub since" (only shown when createdAt exists). Parts: part number = name prefix + created week (YYWW), the primary language and its linguist colour on the pin-1 dot, FW = last-push week, "LAST FLASHED…", or "NO PUBLIC REPO DATA" when the repo is missing. The DNP tile shows the public repo count. BOM: language pockets are sized by live share of public code, and the reels' wound tape scales with QTY. Analyzer: CH0–CH6 by weekday, A0 per week, PEAK and LAST EDGE cursors, a NOW trigger, 8 readouts, and the busiest weekday. Footer: build date, time and REV. Zero values show as "—", and large values get thousands separators and auto-fit (tested with all-zero and very large synthetic data).

**Files.** `build.mjs`, plus these modules in `lib/`:
- `woff2.mjs` and `type.mjs`: text is turned into outlines at build time, so no web font loads in the SVGs.
- `svg.mjs`: shared primitives, bus flow, block outlines.
- `data.mjs`: derived values from data.json.
- `hero.mjs` and `die.mjs`: the hero and the decapped U1.
- `parts.mjs` and `pkg.mjs`: chip packages and their markings.
- `projects.mjs` and `tiles.mjs`: featured parts and project tiles.
- `toolbox.mjs`: the bill of materials.
- `activity.mjs`: the logic analyzer.
- `contact.mjs`: I/O connectors and footer.
- `mobile.mjs` and `mobile2.mjs`: portrait variants.
- `readme.mjs`: assembles the README.

`fonts/*.woff2` are only read by the build. The output is `README.md` plus `assets/*.svg`: 19 desktop slices and 13 `m-*` mobile variants, served through `<picture><source media="(max-width: 600px)">`. All 32 files total 1032 KB, but a viewer downloads only one set: about 640 KB on desktop and about 470 KB on mobile. The largest file is hero.svg at 101 KB. The build is deterministic.

**Known limitations.**
- No kerning, because the outliner does not read GPOS. It is barely visible in the caps-heavy type.
- The page is about 4,000 px tall at 860, roughly 4.3 screens.
- The I/O connectors and the footer have no mobile variant; the links are repeated in the markdown caption.
- The page-wide bus sync assumes all images start their animation at about the same moment. If they load a few hundred ms apart, the seams drift by that much.
- `shared/preview.mjs` drops width-media `<source>` tags, so mobile was checked with a swapped copy of the README. GitHub's API keeps the tags (verified in `.preview/github.html`).
