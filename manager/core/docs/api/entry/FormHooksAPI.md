---
order: 3
---

# Form Hooks API

## createEffectHook

#### Description

Create a custom hook listener

#### Signature

```ts
interface createEffectHook {
  (
    type: string,
    callback?: (
      payload: any,
      form: Form,
      ...ctx: any[] //user-injected context
    ) => (...args: any[]) => void, //High-level callbacks are used to process the encapsulation of the listener and help users achieve parameter customization capabilities
  )
}
```

#### Example

```ts
import { createEffectHook, createForm, type Form } from '@formivue/core'

const onReady = createEffectHook(
  'app:ready',
  (message: string, form: Form) =>
    (listener: (value: string, form: Form) => void) =>
      listener(message, form),
)

const form = createForm({
  effects() {
    onReady((message, model) => console.log(message, model.id))
  },
})

form.notify('app:ready', 'Form is ready')
```

## createEffectContext

#### Description

In the effects function, if we abstract a lot of fine-grained hooks, we need to pass it layer by layer if we want to read the top-level context data in hooks, which is obviously very inefficient, so formivue provides createEffectContext to help users quickly obtain context data

#### Signature

```ts
interface createEffectContext<T> {
  (defaultValue: T): {
    provide(value: T): void
    consume(): T
  }
}
```

#### Example

```ts
import { createEffectContext, createForm, onFormSubmit } from '@formivue/core'

const messages = createEffectContext<string>()

function useSubmitMessage() {
  const message = messages.consume()
  onFormSubmit(() => console.log(message))
}

const form = createForm({
  effects() {
    messages.provide('Submitting account form')
    useSubmitMessage()
  },
})

await form.submit()
```

## useEffectForm

#### Description

useEffectForm is actually a convenient usage of EffectContext, because most scene users will read Form instances, so there is no need to manually define an EffectFormContext

#### Signature

```ts
interface useEffectForm {
  (): Form
}
```

#### Example

```ts
import { createForm, onFormMount, useEffectForm } from '@formivue/core'

function useFormIdentity() {
  const form = useEffectForm()
  onFormMount(() => console.log(form.id))
}

const form = createForm({ effects: useFormIdentity })
form.onMount()
```
