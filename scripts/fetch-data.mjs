#!/usr/bin/env node
// Fetches live GitHub data for the profile and prints it as JSON (data.json schema).
// Usage: GITHUB_TOKEN=... node fetch-data.mjs [login] > data.json
// Needs a token (the Actions GITHUB_TOKEN works). Node 20+, no dependencies.

const login = process.argv[2] || 'abameda';
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  console.error('fetch-data: set GITHUB_TOKEN (or GH_TOKEN).');
  process.exit(1);
}

const query = `query($login: String!) {
  user(login: $login) {
    login name avatarUrl createdAt
    followers { totalCount }
    following { totalCount }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount weekday } }
      }
    }
    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, orderBy: {field: PUSHED_AT, direction: DESC}) {
      totalCount
      nodes {
        name description homepageUrl url isFork stargazerCount forkCount pushedAt createdAt
        primaryLanguage { name color }
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name color } } }
      }
    }
  }
}`;

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-builder' },
  body: JSON.stringify({ query, variables: { login } }),
});
if (!res.ok) {
  console.error(`fetch-data: GitHub API ${res.status} ${await res.text()}`);
  process.exit(1);
}
const json = await res.json();
if (json.errors) {
  console.error('fetch-data: ' + JSON.stringify(json.errors));
  process.exit(1);
}
const u = json.data.user;
const cc = u.contributionsCollection;

const days = cc.contributionCalendar.weeks.flatMap(w => w.contributionDays)
  .map(d => ({ date: d.date, count: d.contributionCount, weekday: d.weekday }));

// streaks, computed over the last-year calendar (today may still be 0, so it doesn't break the current streak)
let longest = 0, run = 0;
for (const d of days) { run = d.count > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
let current = 0;
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i].count > 0) current++;
  else if (i === days.length - 1) continue;
  else break;
}
const last30 = days.slice(-30).reduce((s, d) => s + d.count, 0);
const busiest = days.reduce((a, d) => (d.count > a.count ? d : a), { date: null, count: 0 });

const repos = u.repositories.nodes.filter(r => !r.isFork).map(r => ({
  name: r.name,
  description: r.description,
  homepage: r.homepageUrl || null,
  url: r.url,
  stars: r.stargazerCount,
  forks: r.forkCount,
  pushedAt: r.pushedAt,
  createdAt: r.createdAt,
  primaryLanguage: r.primaryLanguage ? r.primaryLanguage.name : null,
  languages: r.languages.edges.map(e => ({ name: e.node.name, color: e.node.color, bytes: e.size })),
}));

const langTotals = {};
for (const r of repos) for (const l of r.languages) {
  langTotals[l.name] ??= { name: l.name, color: l.color, bytes: 0, repos: 0 };
  langTotals[l.name].bytes += l.bytes;
  langTotals[l.name].repos += 1;
}
const totalBytes = Object.values(langTotals).reduce((s, l) => s + l.bytes, 0) || 1;
const languages = Object.values(langTotals)
  .sort((a, b) => b.bytes - a.bytes)
  .map(l => ({ ...l, share: +(l.bytes / totalBytes).toFixed(4) }));

const out = {
  generatedAt: new Date().toISOString(),
  user: {
    login: u.login, name: u.name, avatarUrl: u.avatarUrl, createdAt: u.createdAt,
    followers: u.followers.totalCount, following: u.following.totalCount,
  },
  totals: {
    publicRepos: u.repositories.totalCount,
    stars: repos.reduce((s, r) => s + r.stars, 0),
    contributionsLastYear: cc.contributionCalendar.totalContributions,
    commitsLastYear: cc.totalCommitContributions,
    pullRequestsLastYear: cc.totalPullRequestContributions,
    issuesLastYear: cc.totalIssueContributions,
    privateContributionsLastYear: cc.restrictedContributionsCount,
    contributionsLast30Days: last30,
    currentStreakDays: current,
    longestStreakDays: longest,
    busiestDay: busiest,
  },
  languages,
  repos,
  calendar: days,
};

process.stdout.write(JSON.stringify(out, null, 2) + '\n');
