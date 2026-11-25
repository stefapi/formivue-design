# Introduction

`@formivue/reactive` is the observable state layer used by the form engine.
It uses JavaScript proxies to track what an effect reads and notify that
effect when its dependencies change. The [concept guide](./concept.md)
explains dependency tracking and the [API examples](../index.md) show how to
subscribe to state changes.

The Vue bridge lives in `@formivue/reactive-vue`. Its
[`observer` wrapper](../api/vue/observer.md) tracks reactive data read
during a Vue component's render.
