# @formivue-design/formivue-vue

Formivue materials of the **Vue 3.5** designer.

- **Components** — Input, TextArea, Password, Select, NumberPicker,
  Checkbox, Radio, Slider, Rate, Switch, DatePicker, TimePicker,
  Cascader, TreeSelect, Transfer, Upload, FormItem, FormLayout,
  FormGrid, FormTab, FormCollapse, Card, Space, Text, Object,
  ArrayCards, ArrayTable (+ `preview-text` for `readPretty` rendering).
- **Form-friendly contract** — every control follows `value` +
  `onChange(value)`; in Vue the component's events are received **as
  props** (`@change` → `onChange` prop).
- **Behavior / Resource** — every material carries its `Behavior`
  (propsSchema via `createFieldSchema` / `createVoidFieldSchema`,
  `src/components/Field/shared.ts`) and its `Resource` (palette).
- **Setters by name** — the schemas reference `'ReactionsSetter'`,
  `'DataSourceSetter'`, `'ValidatorSetter'` **by name**; the settings
  panel (`@formivue-design/vue-settings-form`) resolves them in its
  component registry — the schemas stay framework-agnostic (gap 4.4).

## Component reactions

The `x-reactions` panel of each field opens the **ReactionsSetter**
(`@formivue-design/formivue-setters`): dependencies (`$deps`), state
patches (`fulfill.state`), free-form code (`fulfill.run`). The internal
reference — protocol, expression scope, examples adapted to the
Vue/reka-ui stack — lives in
[`../formivue-setters/docs/reactions.md`](../formivue-setters/docs/reactions.md)
(EN). The examples in the Monaco help pane point to this document.

## Related documentation

- Component reactions (internal reference, EN):
  [`../formivue-setters/docs/reactions.md`](../formivue-setters/docs/reactions.md)
- JSON Schema guide of the `@formivue/vue` fork:
  [`../../manager/vue/docs/guide/json-schema.md`](../../manager/vue/docs/guide/json-schema.md)

## Tests

```bash
pnpm vitest run design/formivue-vue
```
