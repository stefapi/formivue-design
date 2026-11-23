# Ecosystem bridges — zod, vee-validate, vue-i18n

> Goal of this fork: **coexistence** with the existing stack (previimmo:
> vee-validate + zod), not forced replacement. The same zod schema
> file feeds both engines.

## zod → field validator: `zodValidator`

`@formivue/validator/zod` exposes `zodValidator(schema)` which turns
any `ZodType` into a formivue field validator:

```ts
import { z } from 'zod'
import { createForm } from '@formivue/core'
import { zodValidator } from '@formivue/validator/zod'

const loyer = z.number().positive('Rent must be positive')

const form = createForm()
const field = form.createField({
  name: 'loyer',
  validator: zodValidator(loyer),
})
```

- zod error messages (the `message` of each issue) are **preserved**.
- zod success ⇒ no error (formivue convention: the validator returns `null`).
- The validator is **asynchronous**: formivue composes it naturally with the
  other rules (`required`, formats, etc.).

### Same schema for vee-validate and formivue

```ts
// bail.schema.ts — single shared file
export const bailSchema = z.object({
  loyer: z.number().positive('Rent must be positive'),
  charges: z.number().min(0, 'Charges must be positive'),
})

// on the vee-validate side (unchanged):
useForm({ validationSchema: toTypedSchema(bailSchema) })

// on the formivue side (new) — sub-schema per field, zero rewriting:
form.createField({
  name: 'loyer',
  validator: zodValidator(bailSchema.shape.loyer),
})
```

See the runnable demo: `examples/vite-usage/src/m3-vee-validate-bridge.spec.ts`.

## Error messages in French

`@formivue/validator` ships a complete **fr** locale:

```ts
import { setValidateLanguage } from '@formivue/validator'

setValidateLanguage('fr')
// form.setValuesIn(...) → validate → « Ce champ est obligatoire »,
// « Ce champ doit être une adresse e-mail valide », etc.
```

To expose these messages via **vue-i18n**, two options:

1. **Per-field override** (recommended during migration): pass the
   messages in the schemas' `x-validator` / `validator` — zod messages
   and formivue messages take precedence over the locale.
2. **Global registry**: `registerValidateLocale({ fr: { ... } })` to
   fine-tune the labels (the keys are stable: `required`, `number`,
   `maximum`, …).

## Conventions to know (formivue)

- `form.validate()` and `form.submit()` **throw `form.errors`** when the
  form is invalid — wrap with `try/catch` or `await expect(...).rejects`.
- `field.selfErrors` / `field.selfWarnings`: the field's feedbacks (array
  of strings), `field.errors` being the raw form (feedback objects).
- A custom validator can return `null` (nothing), a `string` (message),
  a `boolean` (false = error with the default message) or an
  `IValidateResult` (`{ type: 'error' | 'warning' | ..., message }`).

## The reactive → Vue bridge

See [reactive vs Vue](./reactive-vs-vue.md) — `@formivue/reactive-vue`
(`observer`) is the only glue point between the two systems; for
local UI state, a `useFormValues` composable (tracked autorun + snapshot
in a `ref`) is documented in `examples/vite-usage/src/useFormValues.ts`.
