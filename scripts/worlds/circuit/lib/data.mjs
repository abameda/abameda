// Derived, live values computed from data.json (+ profile.json). Everything that changes daily lives here.
const DAY = 86400000;
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const ymd = iso => String(iso).slice(0, 10);
export const dotDate = iso => ymd(iso).replace(/-/g, '.');
export function humanDate(iso) { const [y, m, d] = ymd(iso).split('-'); return `${+d} ${MON[+m - 1]} ${y}`; }
export const monthName = i => MON[i];

// Chip-style date code YYWW (ISO week).
export function dateCode(iso) {
  const d = new Date(ymd(iso) + 'T00:00:00Z');
  const t = new Date(d); t.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const wk = Math.ceil(((t - y0) / DAY + 1) / 7);
  return String(t.getUTCFullYear()).slice(2) + String(wk).padStart(2, '0');
}

export function daysBetween(a, b) {
  return Math.round((new Date(ymd(b) + 'T00:00:00Z') - new Date(ymd(a) + 'T00:00:00Z')) / DAY);
}
export function ago(iso, ref) {
  if (!iso) return 'NOT YET';
  const n = daysBetween(iso, ref);
  if (n <= 0) return 'TODAY';
  if (n === 1) return 'YESTERDAY';
  if (n < 14) return `${n} DAYS AGO`;
  if (n < 60) return `${Math.round(n / 7)} WEEKS AGO`;
  if (n < 730) return `${Math.round(n / 30.4)} MONTHS AGO`;
  return `${Math.round(n / 365)} YEARS AGO`;
}

export function derive(data, profile) {
  const ref = data.generatedAt;
  const cal = data.calendar || [];
  const repos = data.repos || [];
  const t = data.totals || {};
  const byName = Object.fromEntries(repos.map(r => [r.name.toLowerCase(), r]));
  const latestRepo = [...repos].sort((a, b) => String(b.pushedAt).localeCompare(String(a.pushedAt)))[0];
  const activeDays = cal.filter(d => d.count > 0);
  const lastActive = activeDays.length ? activeDays[activeDays.length - 1].date : null;
  const peak = cal.reduce((m, d) => (d.count > (m?.count ?? -1) ? d : m), null);
  const total = cal.reduce((s, d) => s + d.count, 0);
  // Weekly buckets aligned on Sundays, oldest first.
  const weeks = [];
  for (const d of cal) {
    if (!weeks.length || d.weekday === 0) weeks.push({ start: d.date, days: [] });
    weeks[weeks.length - 1].days.push(d);
  }
  weeks.forEach(w => (w.total = w.days.reduce((s, d) => s + d.count, 0)));
  // Longest run of consecutive active days, recomputed from the calendar so it always matches the trace.
  let run = 0, best = 0, bestEnd = null;
  for (const d of cal) { run = d.count > 0 ? run + 1 : 0; if (run > best) { best = run; bestEnd = d.date; } }
  const langShare = Object.fromEntries((data.languages || []).map(l => [l.name.toLowerCase(), l.share]));
  return {
    ref, rev: dotDate(ref), cal, weeks, repos, byName, latestRepo, lastActive, peak, total,
    activeDays: activeDays.length, days: cal.length,
    duty: cal.length ? activeDays.length / cal.length : 0,
    longest: Math.max(best, t.longestStreakDays || 0), longestEnd: best >= (t.longestStreakDays || 0) ? bestEnd : null,
    currentStreak: t.currentStreakDays || 0,
    last30: t.contributionsLast30Days ?? cal.slice(-30).reduce((s, d) => s + d.count, 0),
    contributions: t.contributionsLastYear ?? total,
    commits: t.commitsLastYear ?? 0, prs: t.pullRequestsLastYear ?? 0,
    publicRepos: t.publicRepos ?? repos.length,
    langShare, languages: data.languages || [],
    joined: data.user?.createdAt,
  };
}

export const pct = s => (s >= 0.1 ? Math.round(s * 100) + '%' : s >= 0.001 ? (s * 100).toFixed(1) + '%' : '<0.1%');

// Number formatting: thousands separators everywhere, and one zero format ('—').
export const n = v => Number(v || 0).toLocaleString('en-US');
export const dash = v => (v ? n(v) : '—');
const WD = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Analyzer readouts, shared by the desktop capture and the mobile variant.
export function stats(D) {
  const byWd = Array(7).fill(0);
  for (const d of D.cal) byWd[d.weekday] += d.count;
  const top = Math.max(...byWd);
  const busiest = top > 0 ? { wd: byWd.indexOf(top), name: WD[byWd.indexOf(top)], total: top } : null;
  const lastN = D.lastActive ? Math.max(0, daysBetween(D.lastActive, D.ref)) : null;
  const edge = lastN == null ? '—' : lastN === 0 ? 'TODAY' : lastN === 1 ? 'YESTERDAY' : `${n(lastN)} DAYS AGO`;
  const cells = [
    ['CONTRIBUTIONS', dash(D.contributions), 'LAST 12 MONTHS'],
    ['LAST 30 DAYS', dash(D.last30), 'CONTRIBUTIONS'],
    ['ACTIVE DAYS', dash(D.activeDays), D.activeDays ? 'IN 12 MONTHS' : ''],
    ['LONGEST RUN', D.longest ? `${n(D.longest)} DAY${D.longest > 1 ? 'S' : ''}` : '—', D.longestEnd ? `ENDED ${humanDate(D.longestEnd)}` : ''],
    ['COMMITS', dash(D.commits), 'LAST 12 MONTHS'],
    ['PULL REQUESTS', dash(D.prs), 'LAST 12 MONTHS'],
    ['BUSIEST WEEKDAY', busiest ? busiest.name : '—', busiest ? `${n(busiest.total)} CONTRIBUTIONS` : '', !!busiest],
    ['LAST EDGE', edge, D.lastActive ? humanDate(D.lastActive) : ''],
  ];
  return { n, busiest, byWd, lastN, cells };
}
