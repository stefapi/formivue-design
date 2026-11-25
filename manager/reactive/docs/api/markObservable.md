# markObservable

## Description

Use `markObservable` to opt an object or class prototype into observation.
For example, it enables observation for objects with a `toJSON` or `toJS`
method, which the default observable check skips.

## Signature

```ts
interface markObservable<T> {
  (target: T): T
}
```

## Example

```ts
import { observable, autorun, markObservable } from '@formivue/reactive'

class A {
  property = ''

  toJSON() {}
}

const a = observable(new A())

autorun(() => {
  console.log(a.property) //will not be triggered when the property changes, because there is a toJSON method in the A instance
})

a.property = 123

//--------------------------------------------

const b = observable(markObservable(new A())) //instance-level mark, only valid for the current instance

autorun(() => {
  console.log(b.property) //Can be triggered when the property changes, because it has been marked as observable
})

b.property = 123

//--------------------------------------------

markObservable(A) //Class-level mark, then all instances will take effect

const c = observable(new A())

autorun(() => {
  console.log(c.property) //Can be triggered when the property changes, because it has been marked as observable
})

c.property = 123
```
