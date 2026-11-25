---
order: 2
---

# Field Effect Hooks

## Examples

Register field effects inside `createForm({ effects })`. Paths and patterns
match field addresses and value paths. See [FormPath](./FormPath.md).

```ts
import {
  createForm,
  onFieldInit,
  onFieldReact,
  onFieldValueChange,
} from '@formivue/core'

const form = createForm({
  initialValues: { accountType: 'personal' },
  effects() {
    onFieldInit('company', (field) => {
      field.title = 'Company'
    })
    onFieldReact('company', (field, currentForm) => {
      field.visible = currentForm.values.accountType === 'business'
    })
    onFieldValueChange('company', (field) => console.log(field.value))
  },
})

form.createField({ name: 'accountType' })
const company = form.createField({ name: 'company' })
form.setValuesIn('accountType', 'business')
company.setValue('Formivue')
```

In Vue, field components trigger mount and unmount hooks as part of their
lifecycle. For headless use, call `field.onMount()` and `field.onUnmount()`
when attaching and detaching the field. Calling `field.validate()` runs the
field validation hooks.

## onFieldInit

#### Description

Used to monitor the side effect hook of a field initialization, we will trigger the field initialization event when we call createField

#### Signature

```ts
interface onFieldInit {
  (pattern: FormPathPattern, callback: (field: Field, form: Form) => void)
}
```

## onFieldMount

#### Description

Used to monitor the side-effect hook of a field that has been mounted, we will trigger the field mount event when we call onMount

#### Signature

```ts
interface onFieldMount {
  (pattern: FormPathPattern, callback: (field: Field, form: Form) => void)
}
```

## onFieldUnmount

#### Description

It is used to monitor the side effect hook that a field has been unloaded. When we call onUnmount, the unmount event will be triggered

#### Signature

```ts
interface onFieldUnmount {
  (pattern: FormPathPattern, callback: (field: Field, form: Form) => void)
}
```

## onFieldReact

A side-effect hook used to implement field reactive logic. Its core principle is that the callback function will be executed when the field is initialized, and the dependency will be automatically tracked at the same time. The callback function will be executed repeatedly when the dependent data changes.

#### Signature

```ts
interface onFieldReact {
  (pattern: FormPathPattern, callback: (field: Field, form: Form) => void)
}
```

## onFieldChange

#### Description

Side effect hook used to monitor the property changes of a field

#### Signature

```ts
interface onFieldChange {
  (
    pattern: FormPathPattern,
    watches?: string[],
    callback: (field: Field, form: Form) => void,
  )
  (pattern: FormPathPattern, callback: (field: Field, form: Form) => void)
}
```

You can pass in the specific set of attributes you want to monitor, or you can leave it alone, the default is to monitor value changes

## onFieldValueChange

Side effect hooks used to monitor changes in a field value

#### Signature

```ts
interface onFieldValueChange {
  (pattern: FormPathPattern, callback: (field: Field, form: Form) => void)
}
```

## onFieldInitialValueChange

Side-effect hooks used to monitor changes in the default value of a field

#### Signature

```ts
interface onFieldInitialValueChange {
  (pattern: FormPathPattern, callback: (field: Field, form: Form) => void)
}
```

## onFieldInputValueChange

Used to monitor the side effect hook triggered by a field onInput

#### Signature

```ts
interface onFieldInputValueChange {
  (pattern: FormPathPattern, callback: (field: Field, form: Form) => void)
}
```

## onFieldValidateStart

#### Description

Monitor the side effect hook that triggers the start of a certain field verification

#### Signature

```ts
interface onFieldValidateStart {
  (pattern: FormPathPattern, callback: (field: Field, form: Form) => void)
}
```

## onFieldValidateEnd

#### Description

Monitor the side effect hook that triggers the end of a certain field verification

#### Signature

```ts
interface onFieldValidateEnd {
  (pattern: FormPathPattern, callback: (field: Field, form: Form) => void)
}
```

## onFieldValidateFailed

#### Description

Listen to the side-effect hook of a field verification trigger failure

#### Signature

```ts
interface onFieldValidateFailed {
  (pattern: FormPathPattern, callback: (field: Field, form: Form) => void)
}
```

## onFieldValidateSuccess

#### Description

Monitor the side effect hook that triggers a successful verification of a certain field

#### Signature

```ts
interface onFieldValidateSuccess {
  (pattern: FormPathPattern, callback: (field: Field, form: Form) => void)
}
```
