# @formivue/grid

**Reactive** form grid — package of the [`manager/`](../../manager) (form
manager, copy of the formivue v3 fork).

- **`class Grid<Container>`** — observable layout engine
  (`@formivue/reactive`): computes columns/rows from the actual sizes of
  the container and its children (`maxColumns`/`minColumns`/`maxWidth`/
  `minWidth` per breakpoint, `columnGap`, `rowGap`, `colWrap`),
  auto-recalculation via `ChildListMutationObserver` +
  `requestAnimationFrame`, with no static CSS.
- **`ChildListMutationObserver`** — list (`childList`) mutation observer
  used by the grid engine.

Children with CSS `position: absolute` or `fixed` are excluded from grid
measurement. Floating controls can share the grid container with its cells.

## Example

```ts
import { Grid } from '@formivue/grid'

const grid = new Grid<HTMLDivElement>({
  maxColumns: 4,
  minColumns: 2,
  columnGap: 8,
})
const disconnect = grid.connect(el)
```

`FormGrid` in the
[`standard renderer`](../../design/formivue-runtime/README.md) binds the grid
to its Vue container. Call the function returned by `connect` when the
container is removed.
