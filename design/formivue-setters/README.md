# @formivue-design/formivue-setters

Formivue setters of the properties panel: `@formivue/vue` bindings of the
fork, components from [`@formivue-design/vue-ui`](../vue-ui) (reka-ui +
Tailwind 4), Monaco via
[`@formivue-design/vue-settings-form`](../vue-settings-form).

- **ReactionsSetter** — the "Configure" dialog of the `x-reactions` panel:
  dependencies (ArrayTable + PathSelector), state patches per property
  (`$self.<prop> = (expression)`, Monaco `javascript.expression`),
  free-form code (`fulfill.run`, Monaco `typescript`). Internal reference:
  **[`docs/reactions.md`](./docs/reactions.md)** (EN) — protocol,
  expression scope, examples adapted to the Vue/reka-ui stack.
- **DataSourceSetter** — data source tree (label/value).
- **ValidatorSetter** — validation rules.

The material schemas
([`@formivue-design/formivue-vue`](../formivue-vue)) reference these setters
**by name**; the `SettingsForm` resolves them via its `components` prop
(legacy-era extensible registry).

## Tests

```bash
pnpm test design/formivue-setters
```
