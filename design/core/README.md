# @formivue-design/core

The designer's engine — **framework-agnostic** (no UI dependency)([`@formivue-design/vue`](../vue)).

- **Observable models** — `Engine` (root), `Workspace` (open forms),
  `Viewport` (visible rectangle), `History` (undo/redo via snapshots),
  `TreeNode` (the design tree) and the associated operations.
- **Events** — mutations (`AbstractMutationNodeEvent` and the
  `FromNodeEvent`…), drag & drop (`DragNodeEvent`…), mouse, keyboard:
  everything goes through the `Engine.subscribeWith` bus (distributed to
  the drivers).
- **Drivers & shortcuts** — the `*Driver`s listen to the DOM and dispatch to
  the engine; the shortcuts (undo/redo, copy/paste, duplicate, delete)
  are wired at the engine level, independently of the rendering framework.
- **`TransformHelper`** — tree transformation helpers
  (move/duplicate/remove…) used by the material behaviors.
- **`GlobalRegistry`** — registries of material behaviors, resources
  (palette) and messages/locales.

## Example

```ts
import { Engine } from '@formivue-design/core'

const engine = new Engine()
const workspace = engine.appendWorkspace(
  new Workspace(engine, { id: 'form-1' }),
)
const tree = workspace.operation.tree
```

The formivue bridge (JSON schemas ⇄ tree) lives in
[`@formivue-design/formivue-transformer`](../formivue-transformer); the complete
materials in [`@formivue-design/formivue-vue`](../formivue-vue). Version, repository
and license: see [`package-meta.json`](../../package-meta.json).
