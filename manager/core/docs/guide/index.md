# Introduction

`@formivue/core` manages a form independently of its UI. The `Form`
model owns values and initial values. Field models track value, visibility,
validation and lifecycle. Effects subscribe to form and field changes so
application logic stays with the form model.

The engine uses `@formivue/reactive` to track state reads and notify dependent
reactions. Vue applications can use the bindings in `@formivue/vue` to
connect observable fields to components.

- [Form model](./form.md)
- [Field model](./field.md)
- [Values](./values.md)
- [Engine architecture](./architecture.md)
- [Vue usage](../../../vue/docs/guide/index.md)
