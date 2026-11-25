# tracker

## Description

`Tracker` records the observable dependencies read by a function. When a
dependency changes, it calls the supplied scheduler. Call `track` when the
work should run again and collect its current dependencies.

## Signature

```ts
class Tracker {
  constructor(scheduler?: (reaction: this['track']) => void, name?: string)
  track: <T>(tracker?: () => T) => T
  dispose: () => void
}
```

## Example

```ts
import { observable, Tracker } from '@formivue/reactive'

const obs = observable({
  aa: 11,
})

const view = () => {
  console.log(obs.aa)
}

const tracker = new Tracker(() => {
  tracker.track(view)
})

tracker.track(view)

obs.aa = 22

tracker.dispose()
```
