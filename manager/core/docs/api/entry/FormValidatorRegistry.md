---
order: 6
---

# Form Validator Registry

## setValidateLanguage

#### Description

Set the built-in verification rule language

#### Signature

```ts
interface setValidateLanguage {
  (language: string): void
}
```

#### Example

```ts
import { setValidateLanguage } from '@formivue/core'

setValidateLanguage('en-US')

setValidateLanguage('zh-CN')
```

## registerValidateFormats

#### Description

Register general regular rules, the current built-in regular library reference: [formats.ts](../../../../validator/src/formats.ts)

#### Signature

```ts
interface registerValidateFormats {
  (rules: { [key: string]: RegExp }): void
}
```

#### Example

```ts
import { registerValidateFormats } from '@formivue/core'

registerValidateFormats({
  integer: /^[+-]?\d+$/,
})
```

## registerValidateLocale

#### Description

Global registration verification language package, the current built-in language package reference: [locale.ts](../../../../validator/src/locale.ts)

#### Signature

```ts
interface registerValidateLocale {
  (locales: {
    [key: string]: {
      key: string
    }
  }): void
}
```

#### Example

```ts
import { registerValidateLocale } from '@formivue/core'

registerValidateLocale({
  ja: {
    required: 'このProjectは mustです',
  },
})
```

## registerValidateMessageTemplateEngine

#### Description

Globally register the verification message template engine. When we return the verification message in the validator, we can perform conversion based on the template engine syntax

#### Signature

```ts
interface registerValidateMessageTemplateEngine {
  (template: (message: ValidatorFunctionResponse, context: any) => any): void
}
```

#### Example

```ts
import { registerValidateMessageTemplateEngine } from '@formivue/core'

registerValidateMessageTemplateEngine((message, context) => {
  return message.replace(/\<\%\s*([\w.]+)\s*\%\>/g, (_, $0) => {
    return FormPath.getIn(context, $0)
  })
})
```

## registerValidateRules

#### Description

Register general verification rules, the current built-in rule library reference: [rules.ts](../../../../validator/src/rules.ts)

#### Signature

```ts
interface registerValidateRules {
  (rules: {
    [key: string]: (
      value: any,
      rule: ValidatorRules,
      ctx: Context,
    ) => ValidateResult | Promise<ValidateResult>
  }): void
}
```

#### Example

```ts
import { registerValidateRules } from '@formivue/core'

registerValidateRules({
  custom(value) {
    return value > 100 ? 'error' : ''
  },
})
```

## getValidateLocaleIOSCode

#### Description

Get the built-in ISO Code

#### Signature

```ts
interface getValidateLocaleIOSCode {
  (language: string): string | undefined
}
```

#### Example

```ts
import { getValidateLocaleIOSCode } from '@formivue/core'

getValidateLocaleIOSCode('en')

// ==> en_US
```
