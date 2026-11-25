# @formivue-design/basic-example

**Basic** example of the Vue 3.5 designer: a minimal studio, inline behaviors/resources and
custom `Field`/`Card` canvas components (via
[`src/content.ts`](./src/content.ts)).

- Same studio as the previous era: `StudioPanel` + `CompositePanel` (tree, palette) +
  `WorkspacePanel` + `ViewportPanel` + `SettingsPanel`, antd chrome →
  [`@formivue-design/vue-ui`](../../design/vue-ui).
- `observer` comes from [`@formivue/reactive-vue`](../../manager/reactive-vue);
  styles → the app's Tailwind entry ([`src/styles.css`](./src/styles.css), V6).

## Getting started

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start:basic   # http://127.0.0.1:3000
```

The other examples: [`sandbox`](../sandbox) (canvas in an iframe),
[`multi-workspace`](../multi-workspace) (two simultaneous workspaces),
[`sandbox-multi-workspace`](../sandbox-multi-workspace),
[`vite-usage`](../vite-usage) (demos of the `@formivue/*` form manager). Version,
repository and license: see [`package-meta.json`](../../package-meta.json).
