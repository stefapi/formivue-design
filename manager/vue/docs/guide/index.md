---
order: 0
---

# Introduction

`@formivue/core` manages form values, validation and field lifecycle.
`@formivue/vue` binds that state to Vue components.

## Two kinds of usage

- **Source-code users** — `Field` / `ArrayField` / `ObjectField` /
  `VoidField` components.
- **JSON-Schema users** — the `SchemaField` component, built on top of the
  former, for dynamic, schema-driven forms.

Both use `FormProvider` to distribute the form context. Schema-driven apps
can register their own components or use
[`@formivue-design/formivue-runtime`](./json-schema.md#render-a-designer-export).

## Installation

```bash
npm install @formivue/core @formivue/vue vue
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

Run `pnpm demo:playground` from the repository root. The Vite playground
includes markup fields, validation bridges and a **Designer form** rendered
with the standard runtime registry.
