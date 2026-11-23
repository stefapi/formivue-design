# @formivue/flow

Run a conditional form flow on an existing Formivue form from Node.js or a UI.
Fields and validators belong to `@formivue/core`. The flow controller manages
navigation and uses the same form values throughout the session.

```ts
import { createForm } from '@formivue/core'
import { createFormFlow } from '@formivue/flow'

const form = createForm()
form.createField({ name: 'accountType', required: true })
form.createField({ name: 'company', required: true })

const flow = createFormFlow(form, {
  steps: [
    {
      id: 'account',
      fields: ['accountType'],
      branches: [{ path: 'accountType', equals: 'personal', next: 'review' }],
    },
    { id: 'business', fields: ['company'] },
    { id: 'review' },
  ],
})

form.setValuesIn('accountType', 'personal')
await flow.next() // account → review
await flow.finish((values) => save(values))
```

Step IDs are unique and can be referenced by `initialStep`, `next`, or a
branch. Branches match scalar answers in order using absolute Formivue value
paths. The first match takes precedence. An omitted `next` follows the start
order and `null` ends the route. In addition to explicit field query patterns
in `fields`, `scope` can identify a subtree by field address.

`next` validates the current step and `finish` revalidates the reachable
route before passing a snapshot of the entire form to the callback. The form
retains earlier answers, including answers from an alternate branch. Use
`finish` for route-scoped validation. The core form's own `submit` method
validates according to its form-wide settings.

Bind a UI to `current`, `route`, `index`, `canGoBack`, `isLast`, `pending`,
`completed`, and `errors`. `back`, `next`, and `finish` report whether the
operation succeeded.
