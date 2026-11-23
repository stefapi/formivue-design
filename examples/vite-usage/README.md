# @formivue/example-vite-usage

The **Vite demos of the form manager** `@formivue/*` show direct usage of the
[`@formivue/vue`](../../manager/vue) bindings, **without** a designer.

- **`FormDemo.vue`** — full demo (SFC, Tailwind 4): forms driven by a JSON
  schema, responsive layout, validation.
- **Ecosystem bridges** — `zod-bridge.spec.ts` (validation via
  [`zod`](https://github.com/colinhacks/zod): `useFormValues`),
  `m3-vee-validate-bridge.spec.ts`
  ([`vee-validate`](https://github.com/logaretm/vee-validate) ⇄ formivue bridge).
- **`playground.spec.ts`** — the playground's **axe-core** a11y suite
  ("zero violations" gate, see the fork's `pnpm test`).

## Getting started

```bash
pnpm demo:playground                                        # Vite dev — http://127.0.0.1:5174
pnpm --filter @formivue/example-vite-usage test             # vitest (bridges + a11y)
pnpm --filter @formivue/example-vite-usage run typecheck    # vue-tsc --noEmit
```

The complete designer (design/) has its own applications:
[`examples/basic`](../basic), [`sandbox`](../sandbox),
[`multi-workspace`](../multi-workspace),
[`sandbox-multi-workspace`](../sandbox-multi-workspace) and the
[`@formivue-design/formivue-vue`](../../design/formivue-vue) playground.
Docs: [`manager/vue/docs`](../../manager/vue/docs) (`pnpm demo:docs`).
Version, repository and license: see [`package-meta.json`](../../package-meta.json).
