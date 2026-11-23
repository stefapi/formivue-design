# Changesets

Versioning driven by [changesets](https://github.com/changesets/changesets).

- **Single version**: the whole repo (root, `manager/`, `design/`,
  `examples/`) shares the version and common metadata declared in
  [`package-meta.json`](../package-meta.json) — single source (version,
  repository, bugs, homepage, author, license). `pnpm meta:sync` propagates
  it to the workspace package.json files; `pnpm meta:check` (gate chained into
  `pnpm lint`) fails on drift.
- **Fixed group**: the 23 publishable packages — 13 `@formivue-design/*`
  (`design/`) + 10 `@formivue/*` (`manager/`) — version together (same
  versions, same changelog per package).
- The examples (private) and the playground are not versioned by
  changesets (`privatePackages.version: false`) — their version line is
  set by `meta:sync`.
- **Pre-release mode disabled** (`.changeset/pre.json` deleted): since the
  stable version `3.0.1`, `changeset version` produces stable versions.
  To open a beta line: `pnpm changeset pre enter beta`.

Flow (gated on decision 8.5 — publishing):

```bash
pnpm changeset             # add a changeset
pnpm changeset:version     # consume the changesets -> versions + changelogs
pnpm changeset:publish     # npm publish (registry: to be decided in 8.5)
```

After `changeset:version` updates the fixed group, update
`package-meta.json` to the new single version, then run `pnpm meta:sync` to
realign root + examples.
