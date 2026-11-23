# @formivue-design/sandbox-multi-workspace-example

**Sandbox multi-workspace** example of the Vue 3.5 designer — combines both
mechanisms: **two workspaces** (`form-1` / `form-2`) whose canvases each live
in an **iframe** driven by the `Sandbox` component of
[`@formivue-design/vue-sandbox`](../../design/vue-sandbox).

- Host ⇄ iframe bridge (`postMessage` + injected `FormivueDesign`/`Formivue`
  globals): a single instance of the engine and reactive tracking across the
  iframes (see [`src/main.ts`](./src/main.ts),
  [`src/sandbox.ts`](./src/sandbox.ts) — IIFE build, `vue` loaded from local assets).
- Previous-era inline behaviors/resources kept; styles → the app's Tailwind
  entry ([`src/styles.css`](./src/styles.css)).

## Getting started

```bash
pnpm start:sandbox-multi-workspace   # http://127.0.0.1:3003
```

The other examples: [`basic`](../basic) (simple studio),
[`sandbox`](../sandbox) (one iframe, one workspace),
[`multi-workspace`](../multi-workspace) (two workspaces, no iframe).
Version, repository and license: see
[`package-meta.json`](../../package-meta.json).
