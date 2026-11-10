// SHEET 02 (cont.): detail drawings for the smaller projects + the plan chest (all repositories).
import { C, W, T, L, R, up, r2, svgDoc, sheet, hatchDefs, arrow } from './svg.mjs';
import { ICONS, ICON_CSS } from './icons.mjs';
import { FEATURED } from './projects.mjs';
import { ago, repoFor, fitSize, dispWidth, fitLines, monoWidth } from './data.mjs';
import { link, img } from './readme.mjs';

const CW = 400, CH = 392;

function card({ letter, no, name, kind, line, meta, draw }) {
  const w = CW, h = CH, sh = sheet(w, h, { zones: false, margin: 8 });
  let b = sh.body + R(18, 18, w - 36, h - 36, { c: C.ink, w: W.thick });
  b += T(34, 46, `DETAIL ${letter}`, { size: 15, font: 'disp', fill: C.ink, ls: 1 }) + T(w - 34, 46, `SHEET ${no}`, { size: 11, fill: C.muted, anchor: 'end', ls: 1.2 });
  b += L(34, 56, w - 34, 56, { c: C.faint, w: W.hair });
  b += draw(34, 64);
  b += L(34, 206, w - 34, 206, { c: C.ink, w: W.med });
  const size = fitSize(name, 25, w - 116);
  b += T(34, 238, name, { size: r2(size), font: 'disp', fill: C.ink, tl: dispWidth(name, size) > w - 116 ? w - 116 : null });
  b += L(w - 72, 230, w - 42, 230, { c: C.red, w: W.med }) + arrow(w - 72, 230, w - 34, 230, { c: C.red, s: 10, wd: 4 });
  b += T(34, 260, kind, { size: 12, fill: C.muted, ls: 0.8, tl: monoWidth(kind, 12, 0.8) > w - 68 ? w - 68 : null });
  const d = fitLines(line, w - 68, [14, 13, 12], 3, 0.1);
  d.lines.forEach((ln, i) => { b += T(34, 288 + i * (d.lh - 1), ln, { size: d.size, fill: C.ink, ls: 0.1 }); });
  b += L(34, 334, w - 34, 334, { c: C.faint, w: W.hair });
  b += T(34, 356, meta, { size: 11.5, fill: C.line, ls: 0.8, tl: monoWidth(meta, 11.5, 0.8) > w - 68 ? w - 68 : null });
  return { w, h, defs: sh.defs + hatchDefs(C.line, 0.6), body: b };
}

// Rows of three; a row of one would orphan a card, so the last four then go two by two.
function rows(cards) {
  const out = [], n = cards.length;
  let i = 0;
  while (i < n) { const left = n - i, take = left === 4 || left === 2 ? 2 : Math.min(3, left); out.push(cards.slice(i, i + take)); i += take; }
  return out;
}

export function build(profile, data, ctx, emit) {
  const rest = profile.projects.filter(p => !FEATURED.includes(p.key));
  const cards = [], n = data.totals?.publicRepos ?? (data.repos || []).length;
  rest.forEach((p, i) => {
    const repo = repoFor(data, p.repo);
    const meta = [p.stack.slice(0, 2).map(up).join(' · '), repo ? `REV ${ago(repo.pushedAt, data.generatedAt)}` : null].filter(Boolean).join('  ·  ');
    const fn = ICONS[p.key] || ICONS.part;
    const c = card({ letter: String.fromCharCode(69 + i), no: `02.${FEATURED.length + 1 + i}`, name: up(p.name), kind: up(p.kind), line: p.line, meta, draw: (x, y) => fn(x, y, p) });
    const file = `d-${p.key}.svg`;
    emit(file, svgDoc({ w: c.w, h: c.h, title: `${p.name}: ${p.kind}`, desc: p.line, fonts: ['disp', 'mono'], css: ICON_CSS, defs: c.defs, body: c.body }));
    cards.push({ href: p.url, file, alt: `${p.name}: ${p.kind}. ${p.line}` });
  });
  // the plan chest: every public repository
  const chest = { name: 'Plan chest', line: `Every public repository on GitHub: ${n} drawings, filed by @${profile.login}.`, stack: [] };
  const c = card({ letter: String.fromCharCode(69 + rest.length), no: 'INDEX', name: 'PLAN CHEST', kind: 'EVERY PUBLIC REPOSITORY', line: chest.line, meta: `GITHUB.COM/${up(profile.login)}?TAB=REPOSITORIES`, draw: (x, y) => ICONS.chest(x, y, chest, n) });
  emit('d-index.svg', svgDoc({ w: c.w, h: c.h, title: 'Plan chest: all public repositories', desc: `${n} public repositories on GitHub.`, fonts: ['disp', 'mono'], css: ICON_CSS, defs: c.defs, body: c.body }));
  cards.push({ href: `${profile.links.github}?tab=repositories`, file: 'd-index.svg', alt: `Browse all ${n} public repositories by @${profile.login}` });
  ctx.md ??= [];
  for (const row of rows(cards)) {
    const pct = row.length === 3 ? '33.3%' : '50%';
    ctx.md.push(`<p align="center">${row.map(c => link(c.href, img(c.file, c.alt, { width: pct }))).join('')}</p>`);
  }
  ctx.textAt = ctx.md.length; // the drawing set as text goes right after the detail cards
}
