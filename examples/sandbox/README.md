# @formivue-design/sandbox-example

**Sandbox** example of the Vue 3.5 designer: the canvas lives in an **iframe** driven by the
`Sandbox` component of [`@formivue-design/vue-sandbox`](../../design/vue-sandbox).
The iframe shares the host's origin and receives direct references to the
host designer and workspace. Use trusted preview content and local assets.

- The iframe loads the local Vue distribution as the `Vue` global, then
  `./sandbox.bundle.js` (IIFE build of
  [`src/sandbox.ts`](./src/sandbox.ts), which externalizes `vue`,
  `@formivue-design/core` and `@formivue/reactive`).
- **Host → iframe injection** — the `Sandbox` injects the parent page's
  `window.FormivueDesign`/`window.Formivue`: the registry, `TreeNode` and
  reactive tracking remain **unique** between host and iframe.
- Previous-era inline behaviors/resources kept
  ([`src/main.ts`](./src/main.ts), [`src/content.ts`](./src/content.ts)).

## Getting started

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start:sandbox   # http://127.0.0.1:3002
```

Multi-workspace variant in an iframe:
[`sandbox-multi-workspace`](../sandbox-multi-workspace). Version, repository
and license: see [`package-meta.json`](../../package-meta.json).
