# @formivue/core

## 3.0.4

### Patch Changes

- official first release
- Updated dependencies
  - @formivue/reactive@3.0.4
  - @formivue/shared@3.0.4
  - @formivue/validator@3.0.4

## 4.0.0

### Patch Changes

- @formivue/reactive@4.0.0
  - @formivue/shared@4.0.0
  - @formivue/validator@4.0.0

## 3.0.0-beta.0

### Major Changes

- v3.0.0 — ESM-only, Vue 3.5, zero external runtime deps

  #### Breaking changes
  - **ESM-only (A1)**: all packages are now `"type": "module"` with an `exports`
    map (types → import). The CommonJS builds (`lib/`) are removed. Use a
    bundler (Vite, webpack 5+), or `esm.sh` if you `require()` them.
  - **UMD/CDN builds removed (A2)**: `dist/*.umd.*.js` and the `unpkg`/`jsdelivr`
    entries are gone.
  - **Node engines**: `node >= 24` (was `8.x–11.x`).
  - **Peer**: `vue ^3.4` (tested on 3.5); `typescript` peer removed from
    `@formivue/json-schema`.
  - **`@formivue/shared`**: the six `*-case` packages are inlined — no external
    runtime dependency on any `@formivue/*` package beyond `@formivue/path`
    (zero new transitive deps in consumer lockfiles).
  - **`@formivue/grid`**: `@juggle/resize-observer` polyfill removed, native
    `ResizeObserver` is used (SSR-safe).

  #### Features
  - `@formivue/validator/zod`: new `zodValidator(schema)` export — use any zod
    `ZodType` as a formivue field validator (peer `zod ^3 || ^4`).
  - French locale (`setValidateLanguage('fr')`) — 35 translated messages.
  - `useFormValues` reactive→Vue bridge documented (examples playground), plus
    a guide on when to use `@formivue/reactive` vs Vue reactivity.

  #### Fixes
  - `markObservable`/`markRaw` no longer crash on arrow functions without
    `prototype` (previously masked by ES5 transpilation).

### Patch Changes

- Updated dependencies
  - @formivue/reactive@3.0.0-beta.0
  - @formivue/shared@3.0.0-beta.0
  - @formivue/validator@3.0.0-beta.0
