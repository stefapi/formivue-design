# @formivue/core — the headless form engine

`@formivue/core` is the framework-agnostic heart of formivue. It manages the
form graph (Form → Fields), validation, values, lifecycle events and
reactions — with **no UI and no Vue dependency**. It runs in the browser,
in Node (server-side validation, migration scripts) and in workers.

```ts
import { createForm } from '@formivue/core'

const form = createForm({ values: { email: '' } })
```

## `createForm(options?: IFormProps<T>)`

| Option                                              | Type                   | Description                                              |
| --------------------------------------------------- | ---------------------- | -------------------------------------------------------- |
| `values`                                            | `object`               | Current form values                                      |
| `initialValues`                                     | `object`               | Initial values (reset baseline)                          |
| `pattern`                                           | `FormPatternTypes`     | `'editable' \| 'readOnly' \| 'disabled' \| 'readPretty'` |
| `display`                                           | `FormDisplayTypes`     | `'none' \| 'hidden' \| 'visible'`                        |
| `editable` / `readOnly` / `disabled` / `readPretty` | `boolean`              | Pattern shortcuts                                        |
| `hidden` / `visible`                                | `boolean`              | Display shortcuts                                        |
| `effects`                                           | `(form: Form) => void` | Register lifecycle hooks (see [effects](./effects.md))   |
| `validateFirst`                                     | `boolean`              | Stop validation at the first error                       |
| `validatePattern`                                   | `FormPatternTypes[]`   | Which patterns trigger validation                        |
| `validateDisplay`                                   | `FormDisplayTypes[]`   | Which displays trigger validation                        |
| `formivue-design`                                   | `boolean`              | Enable graph editability                                 |

## Form API

**State (observable):** `valid`, `invalid`, `errors`, `warnings`,
`successes`, `modified`, `initialized`, `submitting`, `loading`,
`validating`, `values`, `initialValues`, `pattern`, `display`, `props`,
`state`.

**Fields:** `createField`, `createArrayField`, `createObjectField`,
`createVoidField` — each takes `{ name, basePath?, ...fieldProps }` and
returns the field model.

**Values:**

```ts
form.setValues(values, strategy?)      // strategy: 'overwrite' | 'merge' | 'deepMerge' | 'shallowMerge'
form.setValuesIn(path, value)
form.getValuesIn(path)
form.deleteValuesIn(path)
form.existValuesIn(path)
form.setInitialValues(values, strategy?)
form.setInitialValuesIn(path, value)   // + get/delete/exist variants
```

**Pattern / display / lifecycle:**

```ts
form.setPattern('readPretty') // whole form at once
form.setDisplay('hidden')
form.setLoading(bool) / setSubmitting(bool) / setValidating(bool)
form.addEffects(id, effects) / removeEffects(id) / setEffects(effects)
form.clearErrors((pattern = '*')) / clearWarnings() / clearSuccesses()
```

**Validation / submit / reset:**

```ts
try {
  await form.validate(pattern = '*')
  await form.submit((values) => api.post(values))
} catch (errors) {
  // form.validate() and form.submit() REJECT with form.errors when invalid
}
await form.reset('*', { forceClear?: boolean; validate?: boolean })
```

**Graph & query:**

```ts
form.query('users.0.*')           // → Query
  .take()                         // first matching field
  .map((field) => field.value)
  .filter(...)
  .get('title')                   // get a state key
  .getIn('componentProps.suffix')
form.getFormGraph() / setFormGraph(graph) / clearFormGraph()
form.getState() / setState(state) // serializable snapshots
form.notify(type, payload?)       // manual lifecycle dispatch
form.subscribe(fn) / form.unsubscribe(fn)
```

## Field API

**State (observable):** `value`, `initialValue`, `required`, `title`,
`description`, `display`, `pattern`, `disabled`, `readOnly`, `readPretty`,
`editable`, `hidden`, `visible`, `modified`, `loading`, `validating`,
`valid`, `invalid`, `errors` (raw feedback objects), `selfErrors`
(string messages — same for `Warnings`/`Successes`), `validator`,
`dataSource`, `component`, `componentProps`, `decorator`,
`decoratorProps`, `address`, `path`, `index`, `indexes`, `parent`,
`form`, `feedbacks`.

**Methods:**

```ts
field.setValue(value) / setInitialValue(value)
field.onInput(value) / onFocus() / onBlur()
field.setRequired(bool) / setValidator(rules) / setValidatorRule(name, rule)
field.setDataSource(source)
field.validate(triggerType?)
field.reset({ forceClear, validate })
field.queryFeedbacks(search)
field.setState(state) / getState()
field.setTitle(...) / setDescription(...) / setDisplay(...) / setPattern(...)
field.setComponent(...) / setComponentProps(...)
field.setDecorator(...) / setDecoratorProps(...)
field.setData(...) / setContent(...)
```

**ArrayField** additionally:

```ts
field.push(value) / pop() / shift() / unshift(value)
field.remove(index) / insert(index, value)
field.move(from, to) / moveUp(index) / moveDown(index)
```

`move(from, to)` takes zero-based indices within the list. `moveUp` and
`moveDown` wrap at the ends. `shift()` removes the first item and updates
the addresses of the remaining item fields.

**ObjectField** additionally: `addProperty(key, value)`,
`removeProperty(key)`.

**VoidField** models layout-only nodes (no value): section titles,
group boxes, computed display tiles.

**Reactions:** any field accepts a `reactions: ((field) => void)[]`
option — functions re-executed automatically whenever a value they read
changes. This is the idiomatic replacement for Vue `watch`/`computed`
inside form models (see `examples/vite-usage`).

## Type guards & helpers

`isField`, `isArrayField`, `isObjectField`, `isVoidField`,
`isDataField`, `isForm`, `isQuery`, `isGeneralField` — plus the
matching `*State` guards for state snapshots.
`createEffectHook(type, callback?)` builds custom lifecycle hooks;
`createEffectContext<T>(defaultValue?)` provides/consumes typed context
between effects; `useEffectForm()` resolves the current form from an
effect context.
