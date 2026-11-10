# THE BLUEPRINT

**Idea.** The profile is a five-sheet engineering drawing set, with Abdelhmeed as the thing being engineered: white line work on Prussian-blue cyanotype paper, drafting conventions (line weights, ANSI hatches, zone frames, title blocks, cutting plane A-A) and one red-pen redline layer. Sheet 01 is the cover (the name lettered as a section, gears that really mesh). Sheets 02.1-02.4 are one drawing per main project, and 02.5-02.10 are labelled detail drawings for the smaller ones. Sheet 03 is the bill of materials with a language core sample. Sheet 04 is the test report, run off as a pale whiteprint to break the rhythm. Sheet 05 is the sign-off with the approval seal, followed by the contact tags.

**Live data (data.json).** Hero: date, year joined GitHub, public repo count. Project sheets: LAST REVISION (date and age) and MATERIAL (the repo's language bytes as hatched bars). Detail cards: the age of each repo's last push; the plan chest shows the repo count. BOM: the language core sample. Test report: a load histogram of rolling 7-day windows ending today, the last-30-days band, a busiest-day redline on the week that contains it, and a results table (zeros left out; recency shown when there is no activity). REVISIONS lists the 6 latest project pushes and skips the profile repo itself. Sign-off: the seal and approval dates.

**Files.** `build.mjs` is the entry point (it also deletes `assets/.preview` on every build). `lib/`: `svg` (palettes and drawing kit), `data`, `parts`, `hero`, `gears`, `projects`, `drawings-a`, `drawings-b`, `details`, `icons`, `materials`, `report`, `signoff`, `readme`. `fonts/`: Archivo Expanded 800, IBM Plex Mono 500, Kalam. Output: README.md and 22 SVGs, about 1.46 MB in total (largest is hero.svg at 107 KB).

**Phones.** Each project sheet has a portrait variant (`p-*-m.svg`) served through `<picture><source media="(max-width: 600px)">`; I checked that GitHub's sanitizer keeps it. The README also has a collapsed "Read the drawing set as text" block for phones and screen readers.

**Editable without code.** An optional `profile.redlines` object (`hero: [line1, line2]`, `dose`, `signoff`) overrides the red-pen remarks. Every other fact comes from profile.json.

**Deploy note.** The daily Action should commit as `github-actions[bot]`, so its commits don't inflate the calendar, the run lengths or LAST ACTIVE.

**Limitations.** `shared/preview.mjs` drops non-theme `<source>` tags, so its 380 px README render shows the desktop sheets; I checked the phone variants directly with `preview.mjs svg --width 360`. The BOM, report, sign-off and cards have no phone variant, so on phones their facts come from the text block. Delete `.preview/` before copying this folder to the repo.
