# @formivue/path

**Field path** system of the form manager
([`manager/`](../../manager), copy of the formivue v3 fork).

- **`Path`** — parser/manipulator for paths like `a.b[0].c` (alias
  `a.b.0.c`):
  - `getIn(source)` / `setIn(source, value)` — read and **destructive set**
    (recreates the objects/arrays missing along the path);
  - `deleteIn` / `existIn` / `ensureIn`;
  - `concat` / `slice` / `push` / `pop` / `splice` / `parent()` /
    `includes`;
  - `match(pattern)` — does the path match a pattern (`a.*.c`, `*`,
    exclusions `**~a.b`…)?
- **Statics** — `Path.parse(pattern, base?)` (cache included),
  `Path.match(pattern)` (matcher factory), `Path.getIn`/`Path.setIn`…
- **`Pattern`** — the type accepted everywhere: a path, segments, a RegExp,
  `Path`, or a `Path.match()` matcher.

## Example

```ts
import { Path } from '@formivue/path'

const path = new Path('a.b[0].c')
path.getIn({ a: { b: [{ c: 42 }] } }) // 42
path.setIn({}, 42) // { a: { b: [{ c: 42 }] } } — destructive set
```

Version, repository and license: see
[`package-meta.json`](../../package-meta.json).
