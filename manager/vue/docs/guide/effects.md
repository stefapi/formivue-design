# Effects & lifecycle hooks

All effect hooks are registered inside `createForm({ effects })` (or via
`form.addEffects(id, effects)`). Form-level hooks wrap the whole effect in a
`batch`, so N mutations produce one notification.

## Form hooks

Signature: `(callback: (form: Form) => void) => void`

`onFormInit`, `onFormMount`, `onFormUnmount`, `onFormValuesChange`,
`onFormInitialValuesChange`, `onFormInputChange`, `onFormSubmit`,
`onFormSubmitStart`, `onFormSubmitEnd`, `onFormSubmitSuccess`,
`onFormSubmitFailed`, `onFormSubmitValidateStart`,
`onFormSubmitValidateSuccess`, `onFormSubmitValidateFailed`,
`onFormSubmitValidateEnd`, `onFormValidateStart`, `onFormValidateSuccess`,
`onFormValidateFailed`, `onFormValidateEnd`, `onFormReset`,
`onFormGraphChange`, `onFormLoading`, `onFormReact`.

```ts
import {
  createForm,
  onFormSubmitSuccess,
  onFormSubmitFailed,
} from '@formivue/core'

const form = createForm({
  effects() {
    onFormSubmitSuccess(() => console.log('✓'))
    onFormSubmitFailed((form) => console.log(form.errors))
  },
})
```

`onFormReact(callback)` registers a permanent `autorun` on the form — the
callback is re-executed whenever any observable state it reads changes.

## Field hooks

Signature: `(pattern: FormPathPattern, callback: (field, form) => void) => void`.
Patterns match both `field.address` and `field.path` (`'users.*.email'`,
`'*(bail)'` alias groups…).

`onFieldMount`, `onFieldUnmount`, `onFieldValueChange`,
`onFieldInitialValueChange`, `onFieldInputValueChange`,
`onFieldValidateStart`, `onFieldValidateEnd`, `onFieldValidating`,
`onFieldValidateFailed`, `onFieldValidateSuccess`, `onFieldSubmit` (+ the
7 other `onFieldSubmit*` variants), `onFieldReset`, `onFieldLoading`.

```ts
import { onFieldInputValueChange, onFieldReact } from '@formivue/core'

createForm({
  effects() {
    // log every keystroke, everywhere
    onFieldInputValueChange('*', (field) => log(field.address, field.value))

    // log-to-effet on demand
    onFieldReact('depot', (field) => {
      field.description = `Legal cap: ${cap(field)}`
    })
  },
})
```

Special forms:

- `onFieldInit(pattern, callback)` — runs immediately for fields that
  already exist, otherwise subscribes.
- `onFieldReact(pattern, callback)` — `autorun` scoped to the field,
  disposed with it.
- `onFieldChange(pattern, callback)` or
  `onFieldChange(pattern, watches: (keyof IFieldState)[], callback)` —
  `reaction` on the watched state keys (`['value']` by default).

## Custom lifecycles

```ts
import { createEffectHook, createEffectContext } from '@formivue/core'

export const onFormSave = createEffectHook('onFormSave')
export const SaveContext = createEffectContext<SavePayload>()

// in effects:
onFormSave(async (form) => {
  /* ... */
})

// anywhere: form.notify('onFormSave', payload)
```

`LifeCycleTypes` enumerates every built-in event type
(`ON_FORM_SUBMIT_FAILED`, `ON_FIELD_INPUT_VALUE_CHANGE`, …) if you need to
`form.notify()` raw types.
