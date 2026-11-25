# Utilities — `@formivue/shared`, `@formivue/path`, `@formivue/grid`

## `@formivue/shared`

Common engine utilities. The package re-exports path handling from
`@formivue/path`.

- **Arrays** — `toArr`, `each`, `map`, `reduce`, `every`, `some`, `find`,
  `findIndex`, `includes`, `move`.
- **Case** — `lowerCase`, `upperCase`, `camelCase`, `pascalCase`,
  `paramCase` (MIT helpers inlined in this fork — no dependency).
- **Checkers** — `isArr`, `isFn`, `isStr`, `isBool`, `isNum`, `isObj`,
  `isPlainObj`, `isMap`, `isSet`, `isWeakMap`, `isWeakSet`,
  `isNumberLike`, `isRegExp`, `isHTMLElement`, `getType`.
- **Clone / compare / emptiness** — `clone`, `shallowClone`, `isEqual`,
  `isUndef`, `isValid`, `isEmpty`, `stringLength`.
- **Merge & defaults** — `merge` (deepmerge), `lazyMerge`, `defaults`.
- **Other** — `deprecate(fn, message)`, `uid(len?)`,
  `globalThisPolyfill`, `instOf`, `Subscribable`,
  `applyMiddleware`/`IMiddleware`.

## `@formivue/path` — `FormPath`

The path/pattern language used by `query`, `setValuesIn`, effect hook
patterns, etc.

Accessors traverse only own properties, including destructured paths. They
ignore paths containing the reserved segments `__proto__`, `constructor` or
`prototype`.

```ts
import { FormPath } from '@formivue/shared' // re-exported by core & vue

FormPath.parse('users.*.email') // wildcard
FormPath.match('*(users)') // alias group → field.address/path both match
FormPath.getIn(values, 'users.0.name')
FormPath.setIn(values, 'users.0.name', 'Jane')
FormPath.existIn(values, 'users.0.name')
FormPath.ensureIn(values, 'users.0.status', 'active')
FormPath.deleteIn(values, 'users.0.status')
```

Instance: `concat`, `slice`, `push`, `pop`, `splice`, `parent`, `includes`,
`match`, `matchAliasGroup`, `forEach/map/reduce`, `getIn/setIn/deleteIn`,
`ensureIn`, `existIn`. Properties: `entire`, `segments`,
`isMatchPattern`, `isWildMatchPattern`, `isRegExp`,
`haveRelativePattern`, `haveExcludePattern`, `matchScore`.

## `@formivue/grid`

Layout engine used by the standard renderer's `FormGrid`. It computes
reactive `grid-template-columns` from the live container size, item spans
and breakpoints.

```ts
import { Grid } from '@formivue/grid'

const grid = new Grid({
  maxColumns: [3, 5, 6], // per breakpoint
  minColumns: 2,
  maxWidth: 300,
  minWidth: 100,
  columnGap: 8,
  rowGap: 4,
  colWrap: true,
  breakpoints: [720, 1280, 1920], // defaults
  strictAutoFit: false,
  shouldVisible(node, grid) {
    return true
  },
  onDigest(grid) {
    /* layout re-computed */
  },
  onInitialized(grid) {},
})

const dispose = grid.connect(containerElement) // native ResizeObserver
const columns = grid.templateColumns
```

Nodes (`GridNode`) expose `index`, `visible`, `column`, `row`, `span`,
`originSpan`, `element`; `Grid.id(options)` serializes options as a cache
key. Grid layout uses the browser's native `ResizeObserver`.
