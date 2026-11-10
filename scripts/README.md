# How this profile works

The profile README and every image in it are generated. Don't edit `README.md`, `assets/` or `worlds/` by hand, because the next build overwrites them.

- **`profile.json`** holds the human facts: name, role, projects, links and toolbox. Edit this file to change what the profile says.
- **`data.json`** holds live GitHub data, refreshed by `scripts/fetch-data.mjs`.
- **`scripts/worlds/<world>/`** holds the generator for each world: City (the profile itself), Circuit Board and Blueprint.
- **`scripts/build-all.mjs`** builds all three worlds. City goes to the repo root, the others to `worlds/circuit/` and `worlds/blueprint/`.
- **`.github/workflows/profile.yml`** runs the fetch and the build every day, and on any push that changes `scripts/` or `profile.json`, then commits the result.

Run it locally with Node 20 or newer (no npm install needed):

```bash
GITHUB_TOKEN=$(gh auth token) node scripts/fetch-data.mjs abameda > data.json
node scripts/build-all.mjs data.json profile.json
```

To make another world the main profile, change the order and `out` paths in `scripts/build-all.mjs`.
