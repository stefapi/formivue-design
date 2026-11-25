# @formivue-design/vue-settings-form

The properties panel of the Vue designer.

- **`SettingsForm`** — the properties panel: current selection →
  `createForm({ values: node.props })` (observable write-through) →
  rendering of the behavior's `propsSchema` via `SchemaField`. Effects:
  `useLocales` (titles/tooltips/dataSource from `node.getMessage` +
  `GlobalRegistry`) and `useSnapshot` (1 s debounce →
  `operation.snapshot('update:node:props')`).
- **`SchemaField`** combines the settings editors and the component registry
  supplied by the application. See the
  [designer playground](../../examples/designer-playground/README.md) for
  the standard wiring.
- **Editors** — `SizeInput`/`ValueInput` (`createPolyInput`),
  `ColorInput`, `ImageInput`, `PositionInput`, `CornerInput`,
  `MonacoInput`, the style setters (`Box`, `Border`, `BorderRadius`,
  `Background`, `BoxShadow`, `Font`, `Display`, `Flex`), `FoldItem`,
  `CollapseItem`, `InputItems`, `DrawerSetter`.
- **Monaco** — the Vue wrapper uses `@monaco-editor/loader` and handles
  editor creation, value updates and disposal. Serve the installed
  Monaco distribution's `min/vs` directory at `/editor-assets/monaco/vs`.
  The shared [demo Vite config](../../scripts/vite.config.base.mts) serves
  those files and the Formivue type declarations. For a different local base,
  call `setNpmCDNRegistry(base, 'monaco/vs')` before mounting the app.
  The editor provides the `monokai` and `chrome-devtools` themes.

## Styles

Include `@source '../node_modules/@formivue-design/vue-settings-form/dist';`
in the Tailwind entry alongside the shared
[`vue-ui` theme](../vue-ui/README.md).

## Tests

```bash
pnpm test design/vue-settings-form
```
