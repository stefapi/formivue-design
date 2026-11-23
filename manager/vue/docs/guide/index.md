---
order: 0
---

# Introduction

`@formivue/vue` is the Vue binding layer for `@formivue/core`. It binds
ViewModels to components — it does **not** manage form data or validation
itself: it is a rendering glue layer that decouples the dirty logic elegantly.

## Two kinds of usage

- **Source-code users** — `Field` / `ArrayField` / `ObjectField` /
  `VoidField` components.
- **JSON-Schema users** — the `SchemaField` component, built on top of the
  former, for dynamic, schema-driven forms.

Both share the same entry point: `FormProvider` distributes the form context.

## Installation

```bash
$ npm install --save @formivue/core @formivue/vue
```

## Guides

Reference documentation:

- [Core engine](./core.md) — `createForm`, Form/Field/ArrayField API, `Query`
- [Effects & lifecycle hooks](./effects.md) — every `onForm*` / `onField*` hook
- [Vue components & hooks](./vue-components.md) — `FormProvider`, `Field`,
  `SchemaField`, `connect`/`mapProps`, hooks
- [JSON Schema](./json-schema.md) — `x-reactions`, double-curly expressions, `Schema` API
- [Validation](./validation.md) — rules, formats, locales, `zodValidator`
- [Reactivity](./reactive.md) — `@formivue/reactive` + the `reactive-vue` bridge
- [Utilities](./utilities.md) — `@formivue/shared`, `@formivue/path`, `@formivue/grid`
- [What's new in v3](./whats-new.md) — breaking changes, ecosystem additions
- [reactive vs Vue](./reactive-vs-vue.md) — which reactivity system when
- [Ecosystem bridges (zod, vee-validate, i18n)](./ecosystem-bridges.md)

## Playground

A complete Vite playground (Vue 3.5, strict TypeScript, Tailwind 4,
reka-ui, axe a11y, zod bridges) lives in the repo under
`examples/vite-usage` (run `pnpm --filter @formivue/example-vite-usage dev`).
