# Validation — `@formivue/validator`

A field validator accepts strings (rule+format), objects, functions or any
nested mix. Every rule is asynchronous under the hood; formivue composes rules
naturally (and stops early when `validateFirst` is set).

```ts
field.setValidator([
  { required: true, message: 'This field is required' },
  { format: 'email', message: 'Invalid email address' },
  { maximum: 2000, message: 'Above the legal cap' },
  'customRuleName',
  async (value) => (value > 0 ? null : 'Must be positive'),
])
```

A custom validator may return `null` (no error), a `string` (message), a
`boolean` (`false` = default message), or a structured
`IValidateResult` (`{ type: 'error' | 'warning' | 'success', message }`).

## Built-in rules

`format`, `required`, `max`, `min`, `exclusiveMaximum`,
`exclusiveMinimum`, `len`, `pattern`, `validator` (async), `whitespace`,
`enum`, `const`, `multipleOf`, `uniqueItems`, `maxProperties`,
`minProperties` — with aliases `maximum→max`, `minimum→min`,
`maxItems→max`, `minItems→min`, `maxLength→max`, `minLength→min`.

## Built-in formats

`url`, `email`, `ipv6`, `ipv4`, `number`, `integer`, `qq`, `phone`,
`idcard`, `money`, `zh`, `date`, `zip`.

## Locales & messages

Four built-in locales: **`en`, `zh`, `fr`, `ja`**.

```ts
import {
  setValidateLanguage,
  registerValidateLocale,
} from '@formivue/validator'

setValidateLanguage('fr')
// → « Ce champ est obligatoire », « Ce champ doit être une adresse e-mail valide »…

registerValidateLocale({ fr: { required: 'Valeur obligatoire' } })
```

Message templates support `&#123;&#123; var &#125;&#125;` interpolation (`&#123;&#123;len&#125;&#125;`, `&#123;&#123;max&#125;&#125;`…);
the template engine itself is replaceable via
`registerValidateMessageTemplateEngine`.

## Custom registry

```ts
import {
  registerValidateRules,
  registerValidateFormats,
  getValidateRules,
  getValidateFormats,
  getLocaleByPath,
} from '@formivue/validator'

registerValidateRules({
  async positive(value, rule) {
    return value > 0 ? null : ((rule as any).message ?? 'Must be positive')
  },
})
registerValidateFormats({ siret: /^[0-9]{9}$/ })
```

`validate(value, validator, options)` is the raw entry point (returns
`{ error, success, warning }`); `parseValidator*` helpers describe any
validator source into normalized rule objects.

## zod bridge — `zodValidator`

> Ecosystem bridge, new in v3: **the same zod schema file feeds vee-validate
> and formivue — zero rewrite.** Subpath: `@formivue/validator/zod`.

```ts
import { z } from 'zod'
import { createForm } from '@formivue/core'
import { zodValidator } from '@formivue/validator/zod'

export const bailSchema = z.object({
  rent: z.number().positive('Rent must be positive'),
  charges: z.number().min(0, 'Charges must be positive'),
})

// formivue side — one sub-schema per field, no rewrite:
const form = createForm()
const field = form.createField({
  name: 'rent',
  validator: zodValidator(bailSchema.shape.rent),
})
```

- Any `ZodType` works (`safeParse` under the hood; first issue wins).
- Zod issue messages (incl. i18n keys) are transported **as-is**.
- Zod success ⇒ `null` (formivue convention: no error).
- The validator is async; formivue composes it with the other rules.

Runnable proof: `examples/vite-usage/src/zod-bridge.spec.ts` and
`m3-vee-validate-bridge.spec.ts`.

## Conventions to know

- `form.validate()` / `form.submit()` **reject with `form.errors`** when the
  form is invalid — wrap with `try/catch`.
- `field.selfErrors` is the string-message array; `field.errors` is the raw
  feedback objects form.
