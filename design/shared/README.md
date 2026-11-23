# @formivue-design/shared

Utilities shared by all `@formivue-design/*` packages — **zero
dependencies**, framework-agnostic.

- **`Subscribable`** — event bus (`subscribeWith`/`notify`) on which the
  engine (`@formivue-design/core`) and its drivers are built.
- **`Event` / `Driver`** — the bases of the designer's keyboard/mouse/dnd
  events.
- **`Scroller`** — viewport auto-scroll during drag & drop.
- **`Coordinate` / `CoordinateLocator`** — position calculations
  (viewport rects, distance to a TreeNode row/column).
- **Miscellaneous** — `uid`, `clone`, `LRUCache`, `compose`, `array`
  helpers, `KeyCode` (`is<Whatever>Click/Key`), `requestIdle`,
  `globalThisPolyfill` (engine instance sharing ⇄ sandbox iframe).

## Example

```ts
import { uid, Subscribable } from '@formivue-design/shared'

const bus = new Subscribable()
bus.subscribeWith({ notify: () => {} })
bus.notify({ type: 'notify' })
const id = uid()
```

Consumed by [`@formivue-design/core`](../core) and the whole
[`@formivue-design/vue*`](../vue) layer. Version, repository and license: see
[`package-meta.json`](../../package-meta.json).
