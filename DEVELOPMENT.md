# Development guide — formivue / formivue-design

Everything you need to work on this monorepo: package installation,
build, tests, demos, version bumping, publishing.

The one-liner:

```bash
corepack enable && pnpm install && pnpm -r build && pnpm test
```

## Table of contents

- [Requirements](#requirements)
- [Repository layout](#repository-layout)
- [Installing the packages](#installing-the-packages)
- [Build](#build)
- [Tests](#tests)
- [Quality: lint, format, typecheck](#quality-lint-format-typecheck)
- [Demos & playgrounds](#demos--playgrounds)
- [Version bumping](#version-bumping)
- [Publishing](#publishing)
- [Project harness and continuous integration](#project-harness-and-continuous-integration)
- [Pre-pull-request checklist](#pre-pull-request-checklist)

## Requirements

| Tool | Version                            | Why                                          |
| ---- | ---------------------------------- | -------------------------------------------- |
| Node | `>=24 <25` (`engines` field)       | runtime for the Vite builds, tests and smoke |
| pnpm | `10.15.1` (`packageManager` field) | workspaces + `overrides` — a single lockfile |

Enable pnpm through corepack (it honors the `packageManager` field of
`package.json`):

```bash
corepack enable
pnpm --version   # 10.15.1
```

## Repository layout

[ARCHITECTURE.md](./ARCHITECTURE.md) describes the dependency rules and the
contract between the designer and the runtime.

A **self-contained** pnpm-workspaces repo
([`pnpm-workspace.yaml`](./pnpm-workspace.yaml): `manager/*`, `design/*`,
`examples/*`) — two clearly separated roots:

| Folder      | Content                                             | Published      |
| ----------- | --------------------------------------------------- | -------------- |
| `manager/`  | the form engine `@formivue/*`                       | yes (`npm`)    |
| `design/`   | the designer `@formivue-design/*`                   | yes (`npm`)    |
| `examples/` | the Vite apps (basic, sandbox, engine playground…)  | no (`private`) |
| `scripts/`  | project tooling, demo launcher and workspace checks | —              |

The `overrides` in [`pnpm-workspace.yaml`](./pnpm-workspace.yaml) ensure
that every `@formivue/*` dependency
resolves as `workspace:*` to `manager/` (no sibling checkout to clone, a
single lockfile for the whole repo). The `pnpm check:formivue` smoke
additionally verifies that every resolution really points inside
`manager/` and that the `@formivue/reactive` instance is unique.

## Installing the packages

```bash
git clone https://github.com/stefapi/formivue-design.git && cd formivue-design
pnpm install
```

- `pnpm install` creates/honors `pnpm-lock.yaml` and **links the
  workspace packages** (`workspace:*`) — no local publishing needed to
  develop;
- in CI (or to verify an up-to-date lockfile):
  `pnpm install --frozen-lockfile`;
- after any `package.json` change (adding/removing a dependency), rerun
  `pnpm install` to refresh the lockfile and the links.

Add a dependency to a specific package:

```bash
pnpm --filter @formivue-design/vue-ui add reka-ui
pnpm --filter @formivue/example-vite-usage add -D vite
```

> ⚠️ The common metadata (`version`, `repository`, `bugs`, `homepage`,
> `author`, `license`) of every `package.json` is **generated** from
> [`package-meta.json`](./package-meta.json) (see
> [Version bumping](#version-bumping)) — do not edit it by hand inside
> the packages.

## Build

Every package builds as **pure ESM** with `tsdown` (`exports` fields,
`.d.mts` types, `sideEffects: false`, artifacts under `dist/`).

```bash
pnpm -r build    # builds the workspace libraries and example apps
pnpm build       # same thing (root shortcut)
```

Order is guaranteed by pnpm (workspace dependency graph): the
`@formivue/*` packages first, then `@formivue-design/*`, then the apps
that consume them through their dist.

A single package:

```bash
pnpm --filter @formivue-design/vue-ui build
pnpm --filter @formivue/vue build
```

Special builds:

```bash
pnpm --filter @formivue-design/designer-playground-example build  # included in pnpm build
pnpm --filter @formivue/vue build:docs                        # vitepress site (static dist)
```

The `examples/` apps and the playground consume the packages'
**`dist/`** (Tailwind `@source` included): after changing a package,
rebuild it (`pnpm --filter <pkg> build`) to see the change in the demos —
the Vite server re-reads the dist.

### Data model in the designer playground

Start with `pnpm start:playground` and open **Data model** from the left sidebar
or the panel navigation on a small screen. The **Variants demo** link opens
`?demo=variants` in a separate local workspace. It includes two variants with
renamed JSON keys, validation rules and a read-only field. Add `mode=advanced`
to enable the chart and advanced component contracts in the same editor.

The schema view shows editable field rows beside `data.schema.json`. Expand
objects and arrays to work on their children. A field's settings open on
type-specific validation, with separate tabs for its details and canvas bindings.
**Advanced** shows configured rules and lets you find others by label or JSON
Schema keyword. Each rule opens its own editor. **Generate from canvas**
reconciles canvas changes, and **Project and variants** groups variant creation
and project archives. Schema and test data edits share a locally persisted draft.
Applying a valid draft updates the preview. In **JSON documents**, download and import
`ui.json`, `data.schema.json` and `data.json` to move a variant.

## Tests

**Vitest** tests (root config [`vitest.config.mts`](./vitest.config.mts),
jsdom environment + `@vue/test-utils`).

```bash
pnpm test               # vitest run — the whole repo
pnpm test:watch         # vitest --watch
pnpm --filter @formivue/example-vite-usage test   # engine playground suite
```

What `pnpm test` covers:

| Suite                          | Content                                                                   |
| ------------------------------ | ------------------------------------------------------------------------- |
| `manager/*`                    | engine unit tests: reactive, core, validator, json-schema, vue…           |
| `design/*`                     | widgets, settings panel, setters, transformer, a11y                       |
| `design/data-model`            | project drafts, archives, reconciliation, JSON editor and preview session |
| `examples/designer-playground` | designer integration with the canvas, preview, charts and tables          |
| `examples/vite-usage`          | engine playground, validation bridges and a11y                            |
| load/wiring                    | load tests and wiring tests across the two roots                          |
| **a11y**                       | `axe-core` gate — 0 violations tolerated on the repo's code               |

The a11y gates live inside the suites (`a11y.spec.ts`,
`playground.spec.ts` of the Vite example): a component that introduces an
axe violation **fails** `pnpm test`.

Wiring smoke (workspace `workspace:*` resolutions → `manager/`, unique
`@formivue/reactive` instance, ESM `createForm` runtime):

```bash
pnpm check:formivue     # focused run of scripts/__tests__/wiring.spec.ts
```

## Quality: lint, format, typecheck

```bash
pnpm lint          # = meta:check + eslint . (flat config eslint.config.mjs)
pnpm format        # prettier --write .
pnpm format:check # prettier --check . (CI gate)
pnpm typecheck     # manager, design packages and demos, including Vue SFCs
pnpm knip          # report unused files and dependencies
```

- `pnpm lint` starts with **`meta:check`**: the gate fails if any
  `package.json` diverges from [`package-meta.json`](./package-meta.json)
  — after a version bump, always follow up with `pnpm meta:sync`;
- `pnpm typecheck` checks the `manager/` and `design/` packages and every app
  (`tsc --noEmit`), plus `vue-tsc` on the Vite example (SFCs included);
- pre-commit: [`simple-git-hooks`](./package.json) → `lint-staged`
  (`eslint --fix` + `prettier` on the changed files).

## Demos & playgrounds

Two families, two roots:

**Designer** (`design/`, Vite apps of the reference scenario — palette,
tree, canvas, properties panel, JSON export):

| Script                               | URL                   |
| ------------------------------------ | --------------------- |
| `pnpm start:playground`              | http://127.0.0.1:3004 |
| `pnpm start:basic`                   | http://127.0.0.1:3000 |
| `pnpm start:multi-workspace`         | http://127.0.0.1:3001 |
| `pnpm start:sandbox`                 | http://127.0.0.1:3002 |
| `pnpm start:sandbox-multi-workspace` | http://127.0.0.1:3003 |

Add `?mode=advanced` to the designer playground URL to load the advanced palette.

**Engine** (`manager/`, inherited from the form manager):

| Script                 | Content                      | URL                   |
| ---------------------- | ---------------------------- | --------------------- |
| `pnpm demo:playground` | engine Vite playground       | http://127.0.0.1:5174 |
| `pnpm demo:docs`       | vitepress site (guide + API) | http://127.0.0.1:5175 |
| `pnpm demo:all`        | both demos                   | 5174 + 5175           |

The helper script
([`scripts/launch-demos.sh`](./scripts/launch-demos.sh)) accepts custom
ports:

```bash
FORMIVUE_DEMO_PORT=6174 FORMIVUE_DOCS_PORT=6175 pnpm demo:all
```

## Version bumping

The repo runs a **single version** across publishable
packages, the root and the examples. The version is declared
**once** in [`package-meta.json`](./package-meta.json) (single source:
`version`, `repository`, `bugs`, `homepage`, `author`, `license`).

```bash
pnpm meta:sync     # propagates version + metadata to the workspace package.json files
pnpm meta:check    # gate: fails if a package.json diverges (chained into pnpm lint)
```

Versioning is driven by [changesets](https://github.com/changesets/changesets)
([`.changeset/`](./.changeset)):

- All published `@formivue-design/*` and `@formivue/*` libraries are in the
  Changesets `fixed` group and version together. The architecture test
  checks this against the workspace manifests.
- the examples (private) are not versioned by changesets
  (`privatePackages.version: false`) — their version line is set by
  `meta:sync`;
- produced versions are **stable**; to open a pre-release line:
  `pnpm changeset pre enter beta`.

### Full bump flow

1. **Document the release** — for every PR that deserves a changelog
   entry, add a changeset:

   ```bash
   pnpm changeset          # interactive: package selection + type (major/minor/patch)
   ```

   A changeset is a markdown file under `.changeset/` listing the impacted
   packages and the bump level; it is consumed by `changeset version`.

2. **Consume the changesets**:

   ```bash
   pnpm changeset:version   # changeset version — bumps the fixed group + CHANGELOG.md
   ```

3. **Realign the single source** — `changeset version` has written the new
   version into the publishable `package.json` files:

   ```bash
   # edit package-meta.json → "version": "<new single version>"
   pnpm meta:sync           # realigns root + examples on the same version
   pnpm meta:check          # must pass
   ```

4. **Verify then publish** (see [Publishing](#publishing)).

## Publishing

```bash
pnpm changeset:publish    # = changeset publish — publishes to npm (access: public)
```

- publishes the packages of the `fixed` group, each with its `dist/`
  (`files: ["dist"]`, `exports`, `.d.mts`);
- requires an authenticated **npm token** (`NPM_TOKEN` — local login via
  `npm login`, or a secret in CI);
- `commit: false` in the changesets config: `changeset version` **does
  not commit** — committing versions + changelogs stays an explicit step;
- git tags are not pushed automatically by changesets.

Recommended release order:

```bash
pnpm -r build && pnpm test && pnpm lint && pnpm format:check   # green gates
pnpm changeset:version                                          # consume the changesets
# edit package-meta.json + pnpm meta:sync                       # realign the single version
pnpm meta:check && pnpm -r build                                # re-verify after the bump
pnpm changeset:publish                                          # publish to npm
git commit -am "chore(versions): <version>" && git push           # + optional tag
```

## Project harness and continuous integration

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs on pushes
and pull requests targeting `main`. It selects the Node and pnpm versions
from `package.json`, installs the lockfile, and runs the same harness you
can run locally from the repo root:

```bash
pnpm install --frozen-lockfile
pnpm harness
```

The harness stops at the first failing command and reports its name. Once
dependencies are installed, it runs locally without starting a demo server
or downloading a browser.

```text
lint (incl. meta:check)
  → format:check
  → build (packages + Vite apps)
  → knip (unused files and dependencies)
  → typecheck
  → test (workspaces, workspace wiring, Vite example and a11y)
  → build:docs (vitepress)
```

For a focused run of the designer export to runtime scenario after building
the workspace packages:

```bash
pnpm test design/formivue-vue/src/__tests__/schema-flow.spec.ts
```

### Coding agents

Start Claude Code, OpenCode or Codex from the repository root. The shared
project instructions live in [AGENTS.md](./AGENTS.md). OpenCode and Codex
discover it directly. Claude Code loads it through [CLAUDE.md](./CLAUDE.md),
including on versions that rely on that entry point. Use `pnpm harness` for
verification in all three tools. Keep shared instructions in `AGENTS.md` and
architecture rules in [ARCHITECTURE.md](./ARCHITECTURE.md).

PRs follow the **conventional commits** title convention
([`check-pr-title.yml`](./.github/workflows/check-pr-title.yml)) and
commit messages are checked by
[`commitlint.yml`](./.github/workflows/commitlint.yml).

## Pre-pull-request checklist

```bash
pnpm harness           # same checks as CI
pnpm changeset         # a changeset if the change deserves a changelog entry
```
