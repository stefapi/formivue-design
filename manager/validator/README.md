# @formivue/validator

**Validation** toolkit of the form manager.

- **`registerValidateFormats`** / **`registerValidateRules`** /
  **`registerValidateLocale`** — global extensions (`url`/`email`… formats,
  rules, localized messages; `setValidateLanguage('fr'|'en'…)`).
- **`parseValidatorDescriptions`** — the declarative schema DSL
  (`"required string"` or `{ required: true, maxLength: 10 }`) becomes
  executable rules.
- **`validate(value, validator)`** returns message arrays grouped by
  `error`, `warning` and `success`. The field engine consumes this result.

## Example

```ts
import { validate, parseValidatorDescriptions } from '@formivue/validator'

const rules = parseValidatorDescriptions({ required: true, maxLength: 5 })
const { error } = await validate('longer', rules)
```

Reference for the built-in rules: [`rules.ts`/`locale.ts`/`formats.ts`](./src).
Version, repository and license: see
[`package-meta.json`](../../package-meta.json).
