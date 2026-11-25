# @formivue-design/vue-sandbox

**Sandbox** is a same-origin preview iframe for trusted content and assets only.
It shares the parent page's origin and receives references to the designer and
workspace. Load only scripts, styles and schemas you would trust to run in the
parent page. For untrusted previews, use a separate origin and exchange only
validated, serializable messages.

- `Sandbox` renders a full-size iframe. Pass asset URLs through
  `cssAssets` and `jsAssets` and application data through `scope`.
- `useSandbox(props)` returns the iframe ref. On mount it writes the
  document and exposes the host designer, workspace and supplied scope to
  the frame as direct references.
- Frame code reads the supplied scope with `useSandboxScope()` and
  mounts the Vue preview with `renderSandboxContent(render)`. The
  examples share the host's designer and reactive instances.

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

See the complete examples in [`examples/sandbox`](../../examples/sandbox) and
[`examples/sandbox-multi-workspace`](../../examples/sandbox-multi-workspace).
Version, repository and license: see [`package-meta.json`](../../package-meta.json).
