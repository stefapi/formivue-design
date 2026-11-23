# @formivue-design/formivue-transformer

## 3.0.4

### Patch Changes

- official first release
- Updated dependencies
  - @formivue-design/core@3.0.4
  - @formivue-design/shared@3.0.4
  - @formivue/core@3.0.4
  - @formivue/json-schema@3.0.4

## 4.0.0

### Major Changes

- 24b3aa0: **Generation 2 of the `@formivue-design/*` monorepo — formivue v3 (ESM) + Vue 3 port** (**single grouped major**: the 2.0.0-beta absorbs the ESM migration AND the Vue port).

  - **Pure ESM (B4)**: every package switches to `"type": "module"` with `exports` (`.d.mts` types / `.mjs` import); the CJS and UMD outputs, the era's `module`/`main` fields and the `lib/`+`esm/` artifacts disappear.
  - **Vue 3.5 port (V1–V8)**: the UI layer moves from React 17 to **Vue 3.5** on the **`@formivue/vue` + `@formivue/reactive-vue`** bindings of the formivue v3 fork (peers `^3.0.1`), with a **headless reka-ui + shadcn-vue + Tailwind 4** UI stack. The `@formivue-design/{core,shared,transformer}` engine (framework-agnostic) survives intact.
  - **React stack archived (V4/V5)**: `@formivue-design/{react,react-sandbox,react-settings-form}` and `@formivue-design/formivue-antd` leave the workspace (`archive/`), replaced **name for name** by `@formivue-design/{vue,vue-sandbox,vue-settings-form}` and `@formivue-design/formivue-vue` (React → Vue types: `DefineComponent`, `VueComponentProps`). The local bindings `formivue-v3/{react,reactive-react,antd}` (`@formivue/react`, `@formivue/reactive-react`, `@formivue/antd`) leave with them — the fork natively provides the Vue bindings. `react`, `react-dom`, `antd`, `@ant-design/icons`, `@dnd-kit/*`, `moment`, the less pipelines and the per-package `./style.css` **disappear from the repo**.
  - **Theme = Tailwind 4 CSS tokens (V6)**: utility classes live in the components; the **consumer** provides the Tailwind entry (CSS variables + `@theme inline` + `@source` on the packages' dist — `shadcn-vue init` recipe, dark mode by overriding the variables). No more `theme.less`/`variables.less`.
  - **Trimmed materials scope (V3)**: `Cascader`, `Rate`, `Transfer`, `TreeSelect`, `Upload` (material component) postponed to the backlog; the setters that used them switch to the in-house Select/Tree.
  - **a11y = 0 axe-core violation (V8)**: target reached on vue-ui (17-component kitchen sink), the settings panel, the 3 setters and the playground (FORMIVUEDESIGN + PREVIEW views) — a living gate of the vitest suites.
  - **Tooling**: Node `>=24 <25` + pnpm 10 (`packageManager`) — replaces yarn 1 + lerna 4; TypeScript ~5.9 (`moduleResolution: bundler`, consumes the fork's `.d.mts`); ESLint 9 flat; Vitest replaces jest; Vite 7 examples/playground (webpack 4 KO on Node 24).
  - **Additive core exports (rule 3)**: `TransformHelper`, `ITransformHelperProps`, `TransformHelperType`, `ResizeDirection`, `ITransformHelperDragStartProps` become public — the era emitted a deep import into the internals that rolldown-dts refuses.

### Patch Changes

- Updated dependencies [24b3aa0]
  - @formivue-design/core@4.0.0
  - @formivue-design/shared@4.0.0
  - @formivue/core@4.0.0
  - @formivue/json-schema@4.0.0
