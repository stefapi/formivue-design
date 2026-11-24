# Formivue data schema editor

`DataSchemaEditor` is a Vue component with a controlled `modelValue` and
`update:modelValue` event. The caller owns the JSON Schema draft and validates
it with the document compiler before applying it to a form.

| Group            | Editable keywords                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Types and values | `type`, `enum`, `const`                                                                      |
| Numbers          | `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`                   |
| Strings          | `minLength`, `maxLength`, `pattern`, `format`                                                |
| Objects          | `properties`, `required`, `additionalProperties` (boolean), `minProperties`, `maxProperties` |
| Arrays           | `items`, `minItems`, `maxItems`, `uniqueItems`                                               |
| Annotations      | `title`, `description`, `readOnly`, `writeOnly`, `deprecated`, `default`, `examples`         |

Use the node selector to inspect nested properties, items and definitions.
Local JSON Pointer references can be opened from the selected node.
The editor preserves imported keywords outside its editing controls.

For a project inspector, enable the `tree` prop and pass the dependencies
returned by `compileFormDocuments`. The tree shows JSON paths and usages,
including usages resolved through local references. The `navigate` event
identifies a component by its stable designer ID. Applications can supply a
`componentLabel` function and add controls through the `inspector` slot.

`DataValuesEditor` is a separate controlled editor for test values. It can
edit declared properties that have no value yet and values supplied outside
the compiled form, including read-only fields. The application owns the
draft and its validation.
