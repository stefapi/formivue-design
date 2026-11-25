# Changesets

Versioning driven by [changesets](https://github.com/changesets/changesets).

- **Single version**: the whole repo (root, `manager/`, `design/`,
  `examples/`) shares the version and common metadata declared in
  [`package-meta.json`](../package-meta.json) — single source (version,
  repository, bugs, homepage, author, license). `pnpm meta:sync` propagates
  it to the workspace package.json files; `pnpm meta:check` (gate chained into
  `pnpm lint`) fails on drift.
- **Fixed group.** All public libraries in `design/` and `manager/`
  version together, including the standard renderer and the data model
  packages. The architecture test checks membership against their manifests.
- The examples (private) and the playground are not versioned by
  changesets (`privatePackages.version: false`) — their version line is
  set by `meta:sync`.
- Releases are stable by default. Use `pnpm changeset pre enter beta` for a
  beta series.

See the [release procedure](../DEVELOPMENT.md#version-bumping).

```bash
pnpm changeset             # add a changeset
pnpm changeset:version     # consume the changesets -> versions + changelogs
```

After `changeset:version` updates the fixed group, update
`package-meta.json` to the new version. Run `pnpm meta:sync`, refresh the
lockfile and run `pnpm harness` before `pnpm changeset:publish`.
