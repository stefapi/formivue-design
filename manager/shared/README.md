# @formivue/shared

Shared utilities of the form manager.

- **`merge`** — normalized deep merge (`deepmerge`, merge protocol for
  schemas and props); **`clone`** — deep clone without cycles.
- **Checkers** — `isPlainObj`, `isArr`, `isStr`, `isFn`, `isNum`,
  `isRegExp`…; **`toArr`** — array normalization; **`isValid`**/
  **`isEmpty`**.
- **`camelCase`/`pascalCase`/`lowerCase`/`upperCase`** (`case`),
  **`deprecate`**.
- **`path`** — re-export of `Path`/`Pattern`
  ([`@formivue/path`](../path)); **`subscribable`**/**`middleware`** — bus
  and middlewares used by [`@formivue/core`](../core) (and the form
  designer).

## Example

```ts
import { merge, toArr, isPlainObj } from '@formivue/shared'

merge({}, { a: { b: 1 } }, { a: { c: 2 } }) // { a: { b: 1, c: 2 } }
```

Version, repository and license: see
[`package-meta.json`](../../package-meta.json).
