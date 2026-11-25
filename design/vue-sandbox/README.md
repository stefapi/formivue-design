# @formivue-design/vue-sandbox

**Sandbox** is a same-origin preview iframe for trusted content and assets only.
It shares the parent page's origin and receives references to the designer and
workspace. Load only scripts, styles and schemas you would trust to run in the
parent page. For untrusted previews, use a separate origin and exchange only
validated, serializable messages.

The preview content (`ViewPanel` preview) lives in
an isolated iframe, driven from the host window.

- **`Sandbox`** — `defineComponent` component rendering the full-height,
  zero-border `iframe`; props `cssAssets` / `jsAssets` (URLs of the assets
  to load in the iframe), `scope` (`postMessage` scope), `style`;
  **`useSandboxScope()`** and **`renderSandboxContent(render)`** expose the
  iframe scope on the content side.
- **`useSandbox(props)`** — mount composable: returns the iframe `ref` (in
  Vue 3.5 it is called in `setup` — the legacy era did it from the React
  render); sequentially loads the `cssAssets` then the `jsAssets`, wires up
  `postMessage` and load detection.
- **Unchanged bridge** — `postMessage` + `globalThisPolyfill`: host engine ⇄
  iframe instance sharing goes through the global `FormivueDesign.Core`
  (see [`@formivue-design/core`](../core)); the iframe bundles neither
  `@formivue-design/core` nor `@formivue/reactive` (a single tracking
  instance).

## Example

```vue
<script setup>
import { Sandbox } from '@formivue-design/vue-sandbox'
</script>

<template>
  <Sandbox
    :css-assets="['/assets/app.css']"
    :js-assets="['/assets/app.bundle.js']"
  />
</template>
```

Full usage example (driven iframe, `window.FormivueDesign` injected):
[`examples/sandbox`](../../examples/sandbox) and
[`examples/sandbox-multi-workspace`](../../examples/sandbox-multi-workspace).
Version, repository and license: see [`package-meta.json`](../../package-meta.json).
