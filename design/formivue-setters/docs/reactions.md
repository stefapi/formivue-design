# Component reactions — internal reference (Vue designer)

This document is the internal reference for **component reactions**
(`x-reactions`) as implemented in this repository. It replaces the
React/antd-era reference material: every example below targets the actual
Vue stack of generation 2 — `@formivue/vue` bindings, headless
**reka-ui + shadcn-vue + Tailwind 4** primitives (`@formivue-design/vue-ui`).
The JSON Schema guide and the reaction implementation are listed in
[References](#references).

## Where reactions are configured

Every field material of [`@formivue-design/formivue-vue`](../../formivue-vue)
exposes an `x-reactions` entry in its property panel
(`createFieldSchema` / `createVoidFieldSchema`,
`design/formivue-vue/src/components/Field/shared.ts`). The property is
edited through the **ReactionsSetter** dialog of this package
("Configure" button), which is referenced **by name** in the schemas and
resolved through the components registry of
[`@formivue-design/vue-settings-form`](../../vue-settings-form) — the schemas
stay framework-agnostic (documented era deviation 4.4).

The dialog has three panels:

| Panel                  | Editor                                           | Produces                                   |
| ---------------------- | ------------------------------------------------ | ------------------------------------------ |
| **Associated Fields**  | `ArrayTable` of dependencies                     | `dependencies` rows (see below)            |
| **Property Reactions** | `$self.<prop> = (expression)` — Monaco, per prop | `fulfill.state` as `{{expression}}` values |
| **Action Reactions**   | free code block — Monaco, TypeScript             | `fulfill.run` (function body)              |

The resulting object is stored on the tree node props, serialized with
the schema, and applied at render time by the `@formivue/json-schema`
transformer (`manager/json-schema/src/transformer.ts`) through the
`@formivue/vue` `SchemaField` — both in the designer preview and in
consuming applications.

## The reaction object

What the dialog produces — and what the protocol understands:

```ts
interface Reaction {
  dependencies?: Array<{
    source: string // field path, relative or absolute
    property?: string // field state property to read (default: 'value')
    name?: string // variable name exposed as $deps.<name>
    type?: string // informational — drives the $deps typings in Monaco
  }>
  fulfill?: {
    state?: Record<string, string> // '{{expression}}' state patches
    run?: string // JS statements, executed as a function body
  }
}
```

Notes on each part:

- **`dependencies`** — the dialog writes an array of `{ source, property,
name }` rows. Hand-written schemas may also use plain path strings
  (`'otherField'`) or paths with an explicit property
  (`'otherField#value'` — `#` separates the field path from the state
  property), or an alias record (`{ VariableName: 'otherField' }`).
- **`$deps`** — the dependency values, as an array (positional) or a
  named map when aliases/`name`s are used (`$deps.VariableName`).
  `$dependencies` is an alias.
- **`fulfill.state`** — each value is a double-curly expression string,
  compiled against the scope and patched onto the field state. The
  property list offered by the dialog: `visible`, `hidden`, `display`,
  `pattern`, `title`, `description`, `value`, `initialValue`,
  `required`, `dataSource`, `componentProps`, `decoratorProps`.
- **`fulfill.run`** — arbitrary statements, compiled as a function body
  with the same scope (async patterns allowed).

Passive and active modes (protocol level, for hand-written schemas):

- **Without `target`** (designer output): the reaction runs reactively on
  the owner field — dependencies re-run it whenever the watched state
  changes.
- **With `target`** (plus optional `when` / `otherwise` / `effects`):
  active mode — the reaction patches _another_ field, on lifecycle
  effects. Default effects: `['onFieldInit', 'onFieldValueChange']`;
  available: `onFieldInit`, `onFieldMount`, `onFieldUnmount`,
  `onFieldValueChange`, `onFieldInputValueChange`,
  `onFieldInitialValueChange`, `onFieldValidateStart`,
  `onFieldValidateEnd`, `onFieldValidateFailed`, `onFieldValidateSuccess`.
  In active mode the target's state is exposed as `$target`.
- A reaction may also be a plain function `(field) => void` or a scope
  expression referencing one (`'{{myReaction}}'`).

## Built-in expression scope

Available in every `{{expression}}` and in `fulfill.run`
(`getBaseScope`, `manager/json-schema/src/transformer.ts`):

| Variable                                   | Description                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `$self`                                    | The current field model (`Field`).                                          |
| `$form`                                    | The current form model.                                                     |
| `$values`                                  | The top-level form values.                                                  |
| `$deps` / `$dependencies`                  | The reaction dependency values (see above).                                 |
| `$observable(target, deps?)`               | Creates a persistent observable state object (memoized).                    |
| `$memo(callback, deps?)`                   | Creates persistent computed data (memoized).                                |
| `$effect(callback, deps?)`                 | Runs side-effect logic, re-run when deps change (returns optional cleanup). |
| `$props(props)`                            | Sets component props on the current field (`field.setComponentProps`).      |
| `$target`                                  | The target field state — active mode only.                                  |
| `$record`, `$records`, `$lookup`, `$index` | Array-field scope (row record, rows, parent lookup, row index).             |

## Vue stack specifics (reka-ui)

What replaces the React/antd idioms the upstream examples were written
against:

- **Form-friendly contract** — every control primitive of
  `@formivue-design/vue-ui` (Input, Select, NumberPicker, Checkbox, Radio,
  Slider, Cascader, …) follows `value` + `onChange(value)`. In Vue,
  component events are received **as props**, so a reaction hooks into
  user input with `$props({ onChange(value) { ... } })`. There is no
  antd `onSearch` / `showSearch` anywhere in the stack.
- **Select** — no search box; options come from `field.dataSource`
  (mapped to `options` by the material's `mapProps`), and `multiple:
boolean` replaces the antd `mode` prop. For dynamic options, drive
  `$self.loading` + `$self.dataSource`; for cascading reloads, capture
  `onChange` into an `$observable` state (see example 2 below).
- **Decorators** — `FormItem` / `FormLayout` are headless: the layout
  props are `labelWidth`, `layout`, `labelAlign`, `size`. The antd
  `labelCol` / `wrapperCol` / `colon` grid props do not exist in this
  port — use `labelWidth` in `decoratorProps` reactions.
- **Registration by name** — components referenced by schemas are
  strings resolved through the `createSchemaField` components map (the
  designer wires the `Materials` card of `@formivue-design/formivue-vue`).
- **Monaco typings** — the form opens immediately while
  `initDeclaration` loads the Formivue types for autocompletion.
  The playground serves Monaco and those declarations from its own build.
  The editors provide `$self`, `$form`, `$values`, `$observable`,
  `$memo`, `$effect`, `$props` and the per-row `$deps` map.

## Examples

These mirror the help pane shown next to the Monaco editors
(`src/components/ReactionsSetter/helpers.ts`).

### Boolean state (`visible`, `hidden`, `required`…)

```js
false
$deps.VariableName === 'TARGET_VALUE'
$deps.VariableName !== 'TARGET_VALUE'
$deps.VariableName1 && $deps.VariableName2
$deps.VariableName > 100
!$deps.VariableName
```

### Display / pattern

```js
'none'
$deps.VariableName === 'TARGET_VALUE' ? 'visible' : 'none'
$deps.VariableName > 100 ? 'visible' : 'hidden'
$deps.VariableName === 'TARGET_VALUE' ? 'editable' : 'disabled'
```

### dataSource (options of a Select…)

```js
;[
  { label: 'item1', value: '1' },
  { label: 'item2', value: '2' },
  ...$deps.VariableName,
]
```

### componentProps / decoratorProps

```js
// componentProps — placeholder exists on every control primitive
{
  placeholder: $deps.VariableName
}

// decoratorProps — FormLayout is headless: labelWidth, not antd labelCol
{
  labelWidth: 120
}
{
  labelWidth: $deps.VariableName
}
```

### Action reactions (`fulfill.run`)

```js
// Example 1 — async Select: load options once on mount
$effect(() => {
  $self.loading = true
  fetch('/api/options')
    .then((response) => response.json())
    .then(
      ({ data }) => {
        $self.loading = false
        $self.dataSource = data
      },
      () => {
        $self.loading = false
      },
    )
}, [])

// Example 2 — cascading Select: options follow the selection.
// Vue contract: the component receives events as props (onChange).
const state = $observable({ selected: '' })

$props({
  onChange(selected) {
    state.selected = selected
  },
})

$effect(() => {
  if (!state.selected) return
  $self.loading = true
  fetch(`/api/options?parent=${state.selected}`)
    .then((response) => response.json())
    .then(
      ({ data }) => {
        $self.loading = false
        $self.dataSource = data
      },
      () => {
        $self.loading = false
      },
    )
}, [state.selected])

// Example 3 — same, filtered by the reaction dependencies ($deps)
const state = $observable({ selected: '' })

$props({
  onChange(selected) {
    state.selected = selected
  },
})

$effect(() => {
  $self.loading = true
  fetch(`/api/options?parent=${state.selected}&other=${$deps.VariableName}`)
    .then((response) => response.json())
    .then(
      ({ data }) => {
        $self.loading = false
        $self.dataSource = data
      },
      () => {
        $self.loading = false
      },
    )
}, [state.selected, $deps.VariableName])
```

## Deviations from the React/antd era

The examples were ported from the React/antd generation and adapted;
the deltas are deliberate and documented:

| Era (React + antd)                        | This port (Vue + reka-ui)                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Legacy documentation link                 | This document and the local JSON Schema guide                                                  |
| `$props({ onSearch(keyword) { ... } })`   | `$props({ onChange(value) { ... } })` — the `value` + `onChange(value)` form-friendly contract |
| `labelCol` / `wrapperCol` decorator props | `labelWidth` (headless FormLayout)                                                             |
| Select `mode: 'multiple'` / `showSearch`  | `multiple: boolean`; no search box — cascading pattern via `onChange`                          |

The remaining example expressions (`$deps.VariableName`, ternaries,
`$observable`, `$effect`, …) are framework-agnostic formivue expressions
and are kept as is.

## References

- `@formivue/vue` JSON Schema guide (internal):
  [`manager/vue/docs/guide/json-schema.md`](../../../manager/vue/docs/guide/json-schema.md)
- Reaction protocol implementation (internal):
  `manager/json-schema/src/transformer.ts`
- ReactionsSetter source (internal):
  `src/components/ReactionsSetter/`
- Materials exposing `x-reactions` (internal):
  [`design/formivue-vue`](../../formivue-vue)
