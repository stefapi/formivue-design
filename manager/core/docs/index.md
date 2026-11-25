---
title: Formivue form engine
order: 10
---

# Formivue form engine

`@formivue/core` manages observable values, field state, validation and
effects. Use it in a headless workflow or connect it to Vue with
`@formivue/vue`.

```bash
npm install @formivue/core
```

## Headless form

```ts
import { createForm } from '@formivue/core'

const form = createForm()
form.createField({ name: 'email', required: true, validator: 'email' })
form.setValuesIn('email', 'hello@example.com')

const values = await form.submit()
```

See the [core guide](./guide/index.md) for the domain model and the
[effects guide](../../vue/docs/guide/effects.md) for field and form hooks.
The [Vue guide](../../vue/docs/guide/index.md) shows how to bind the form
to components.
