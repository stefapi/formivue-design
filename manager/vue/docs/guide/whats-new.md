# What's new in v3 — breaking changes

This is a **Vue 3.5-only ESM fork** of formivue, published as
`3.0.0-beta`. The API surface of all 9 packages is **identical to v2.3.7**
(verified against an archived API baseline: 648 tests / 51 suites, diff ∅) —
the changes are tooling, packaging and ecosystem:

## Ecosystem additions

- **`zodValidator`** (`@formivue/validator/zod`) — turn any zod schema into a
  formivue field validator; the same schema file feeds vee-validate and
  formivue. Peer: `zod ^3 || ^4`. See [validation](./validation.md).
- **Locale `fr`** built into `@formivue/validator` (en/zh/fr/ja).
- Docs: [reactive vs Vue](./reactive-vs-vue.md) and
  [ecosystem bridges](./ecosystem-bridges.md) guides.
- Runnable playground (`examples/vite-usage`): Vue 3.5 + strict TS +
  Tailwind 4 + reka-ui, axe = 0 violation.

## Breaking changes

- **ESM only.** `"type": "module"`, `exports` map, `target es2020`.
  No more CJS/UMD builds, no `main`/`jsnext:main`/`unpkg` entries.
- **Node ≥ 24, pnpm 10** (workspaces), TypeScript ≥ 5 in peers.
- **Vue `^3.5` only.** `vue-demi` and any Vue 2 compatibility are gone
  (the fork was already Vue-3-only).
- **Zero runtime dependencies** across the 9 packages: case helpers
  inlined in `@formivue/shared`, `@juggle/resize-observer` dropped in favor
  of the native `ResizeObserver`.
- TypeScript `strict` across the repo (postponed to v3.1+ for packages).

## Tooling

Jest 26 → **Vitest 3** (651 tests, incl. a fixed latent
`markRaw`/`markObservable` bug on arrow functions), ESLint 9 flat config,
Prettier 3, `simple-git-hooks` + `lint-staged`, `knip` (0 orphan deps),
changesets (fixed group of 9 packages), CI guards (style, lint, tests) and
a real-install test performed in a copy of the downstream
`previimmo-frontend` app (`vue-tsc` 0 error, `vite build` OK).
