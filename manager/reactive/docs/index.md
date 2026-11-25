---
title: Formivue reactivity
order: 10
---

# Formivue reactivity

`@formivue/reactive` tracks reads of observable state and updates the
effects that depend on it.

```bash
npm install @formivue/reactive
```

```ts
import { autorun, observable } from '@formivue/reactive'

const state = observable({ count: 0 })
const dispose = autorun(() => console.log(state.count))

state.count += 1
dispose()
```

For Vue rendering, use the [`observer` wrapper](./api/vue/observer.md)
from `@formivue/reactive-vue`. See the [concept guide](./guide/concept.md)
for tracking, computed values and batches.
