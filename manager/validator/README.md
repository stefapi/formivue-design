# @formivue/validator

**Validation** toolkit of the form manager.

- **`registerValidateFormats`** / **`registerValidateRules`** /
  **`registerValidateLocale`** — global extensions (`url`/`email`… formats,
  rules, localized messages; `setValidateLanguage('fr'|'en'…)`).
- **`parseValidatorDescriptions`** — the declarative schema DSL
  (`"required string"` or `{ required: true, maxLength: 10 }`) becomes
  executable rules.
- **`validate(value, validator)`** — the engine: rules + localized messages →
  responses (`ValidateResponse[]`) consumed by the fields
  ([`@formivue/core`](../core)).

## Example

```ts
import { validate, parseValidatorDescriptions } from '@formivue/validator'

const rules = parseValidatorDescriptions({ required: true, maxLength: 5 })
await validate('stef', rules) // → localized error messages if the rules are not met
```

Reference for the built-in rules: [`rules.ts`/`locale.ts`/`formats.ts`](./src).
Version, repository and license: see
[`package-meta.json`](../../package-meta.json).
