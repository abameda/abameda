// The live language meter on Market Street: what the city's code is made of, by bytes.
// Labels are placed only where their measured width fits; the rest are gathered at the end.
import { f, P as PAL, mix, tag, monoW } from './svg.mjs';

// Languages of at least 3% by bytes, the rest folded into "Other"; shared with the phone meter.
export function meterSegs(data) {
  const langs = (data.languages || []).slice().sort((a, b) => b.share - a.share);
  const top = langs.filter(l => l.share >= 0.03), rest = langs.filter(l => l.share < 0.03).reduce((a, l) => a + l.share, 0);
  const segs = [...top.map(l => ({ name: l.name, share: l.share, color: l.color })), ...(rest > 0 ? [{ name: 'Other', share: rest, color: '#7a6a9a' }] : [])];
  return { langs, segs, sum: segs.reduce((a, b) => a + b.share, 0) || 1 };
}

export function meter(data, x, y, w) {
  const { langs, segs, sum } = meterSegs(data);
  if (!langs.length) return '';
  const by = y + 34;
  let s = `<rect x="${x - 18}" y="${y - 22}" width="${w + 36}" height="112" rx="12" fill="#140c2c" fill-opacity=".9" stroke="${PAL.cream}" stroke-opacity=".14"/>`;
  s += tag(x, y + 4, 'THE CITY RUNS ON', { size: 12.5, fill: PAL.cream, ls: 2.4 });
  s += tag(x + w, y + 4, `${langs.length} LANGUAGES, BY BYTES`, { size: 11, fill: PAL.mute, ls: 1.2, anchor: "end" });
  let cx = x, bars = '', labels = '', freeX = x;
  const skipped = [];
  segs.forEach((sg, i) => {
    const sw = (sg.share / sum) * w, c = mix(sg.color || '#888888', '#1a1131', 0.12);
    bars += `<rect x="${f(cx)}" y="${by}" width="${f(Math.max(0, sw - 3))}" height="12" fill="${c}"/>`;
    const text = `${sg.name.toUpperCase()} ${Math.max(1, Math.round(sg.share * 100))}%`, tw = monoW(text, 11.5, 1);
    const tailRoom = i === segs.length - 1 ? 0 : 60;
    if (cx >= freeX && cx + tw <= x + w - tailRoom) {
      labels += `<rect x="${f(cx)}" y="${by + 16}" width="2" height="9" fill="${c}"/>` + tag(cx + 6, by + 26, text, { size: 11.5, fill: i === 0 ? PAL.cream : PAL.lav, ls: 1 });
      freeX = cx + tw + 18;
    } else skipped.push(text);
    cx += sw;
  });
  if (skipped.length) labels += tag(x + w, by + 46, `+ ${skipped.join(' · ')}`, { size: 11, fill: PAL.mute, ls: 1, anchor: 'end' });
  return s + `<clipPath id="meterClip"><rect x="${x}" y="${by}" width="${w}" height="12" rx="6"/></clipPath><g clip-path="url(#meterClip)">${bars}</g>${labels}`;
}
