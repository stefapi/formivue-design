# @formivue-design/vue-settings-form

The properties panel of the Vue designer.

- **`SettingsForm`** — the properties panel: current selection →
  `createForm({ values: node.props })` (observable write-through) →
  rendering of the behavior's `propsSchema` via `SchemaField`. Effects:
  `useLocales` (titles/tooltips/dataSource from `node.getMessage` +
  `GlobalRegistry`) and `useSnapshot` (1 s debounce →
  `operation.snapshot('update:node:props')`).
- **`SchemaField`** — `createSchemaField` from the fork: this package's
  editors + the real bindings of
  [`@formivue-design/formivue-vue`](../../design/formivue-vue)
  (`Materials` map).
- **Editors** — `SizeInput`/`ValueInput` (`createPolyInput`),
  `ColorInput`, `ImageInput`, `PositionInput`, `CornerInput`,
  `MonacoInput`, the style setters (`Box`, `Border`, `BorderRadius`,
  `Background`, `BoxShadow`, `Font`, `Display`, `Flex`), `FoldItem`,
  `CollapseItem`, `InputItems`, `DrawerSetter`.
- **Monaco** — `@monaco-editor/loader` (framework-agnostic) kept;
  `@monaco-editor/react` (React) replaced with an **in-house Vue
  wrapper** (`create`/`setValue`/`dispose`/`onMount`). Serve the installed
  Monaco distribution's `min/vs` directory at `/editor-assets/monaco/vs`.
  The shared [demo Vite config](../../scripts/vite.config.base.mts) serves
  those files and the Formivue type declarations. For a different local base,
  call `setNpmCDNRegistry(base, 'monaco/vs')` before mounting the app.
  Legacy-era `monokai`/`chrome-devtools` themes are kept.

## Styles

No bundled CSS: the Tailwind 4 utility classes live in the source code —
the consumer scans this package via `@source
'@formivue-design/vue-settings-form'` (see
[`@formivue-design/vue-ui`](../vue-ui)). The `dn-*` classes are kept as
test hooks.

## Tests

```bash
pnpm vitest run packages/vue-settings-form
```
