# Working on Formivue

[DEVELOPMENT.md](./DEVELOPMENT.md) is the reference for setup, builds,
tests, demos, and releases.
[ARCHITECTURE.md](./ARCHITECTURE.md) defines package boundaries and the
designer-to-runtime contract.

## Where changes belong

- `manager/` contains the headless `@formivue/*` engine and Vue bindings.
  Keep its workspace dependencies inside `manager/`.
- `design/` contains the visual builder, its property editors, the JSON
  transformer, and the shared Vue materials. The designer canvas and runtime
  bindings often have separate entry points in the same material folder.
- Keep `design/vue-ui` independent of Formivue packages. Import other packages
  through their public exports and keep the published dependency graph acyclic.
- `examples/vite-usage/` runs the standalone manager demo. Its **Designer form**
  section renders the JSON schema with the shared `Materials` registry.
- Shared package metadata comes from `package-meta.json`. Apply metadata changes
  with `pnpm meta:sync`.

## Verification

Install with `pnpm install --frozen-lockfile`. Run `pnpm harness` from the root
for the same checks as CI. The harness builds the workspaces before running the
checks that consume their published entry points.

For a focused check, run `pnpm test <path-to-spec>` after building the affected
packages and their dependencies. The demos consume `dist/`, so rebuild changed
packages before verifying them with `pnpm start:playground` (designer) or
`pnpm demo:playground` (manager).

For exported settings, check the designer canvas and the runtime through
`transformToSchema`, JSON serialization and `SchemaField` with `Materials`.
Test layout containers with fields inside. For repeated lists, check that moves
and deletions preserve the association between each remaining row and its fields.
Keep demo assets local and use workspace packages for `@formivue/*`.
