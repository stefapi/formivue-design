# @formivue-design/multi-workspace-example

**Multi-workspace** example of the Vue 3.5 designer: **two workspaces**
(`form-1` / `form-2`) rendered simultaneously in the same studio.

- Each workspace has its own canvas via the `Workspace` context
  ([`@formivue-design/core`](../../design/core)); the tree, history and
  selection are specific to each form.
- Previous-era inline behaviors/resources kept verbatim
  ([`src/main.ts`](./src/main.ts)); the `window.engine` debug hook kept;
  styles → the app's Tailwind entry ([`src/styles.css`](./src/styles.css)).

## Getting started

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start:multi-workspace   # http://127.0.0.1:3001
```

Variant with the canvas in an iframe:
[`sandbox-multi-workspace`](../sandbox-multi-workspace). Version, repository
and license: see [`package-meta.json`](../../package-meta.json).
