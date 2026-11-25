# Formivue data schema editor

`DataSchemaEditor` edits a controlled JSON Schema draft. The caller owns the
draft and validates it before compiling the form. Enable `tree` for a schema
inspector or use `builder` for inline field rows and a rules inspector. Pass
the dependencies returned by `compileFormDocuments` to show
where each schema is used, including through local anchors and references.
The `navigate` event returns a stable component ID. The `inspector` slot is
available for application actions such as variant renaming.

`DataValuesEditor` edits test values separately. It can supply read-only
and off-form values or insert a schema example explicitly. Editing the
schema does not replace test values.

## Draft 2020-12 coverage

The graphical [keyword round-trip tests](../../examples/designer-playground/src/__tests__/schema-keywords.spec.ts)
start from an empty schema inspector. They add each rule, change it, export
and reimport the documents, and remove the rule. Subschema tests also switch
between object, `true` and `false` using the schema form selector.
The [branch and runtime tests](../../examples/designer-playground/src/__tests__/schema-branches.spec.ts)
exercise a bound row and chart, a dynamic reference, item evaluation and
the field paths of validation errors.

| Keywords                                                                   | Graphical control                                                     | Validation and form behaviour after reimport                                                                                                                                               |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `type`                                                                     | Checkboxes for simple and union types, including `integer` and `null` | The validator checks values and the compiler checks each bound control's domain.                                                                                                           |
| `enum`, `const`                                                            | Typed values with a list for enums                                    | The validator preserves JSON types and the compiler supplies compatible choices.                                                                                                           |
| `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf` | Numeric inputs                                                        | The validator checks the bounds and decimal multiple. Supported numeric controls receive the shared limits and step.                                                                       |
| `minLength`, `maxLength`, `pattern`, `format`                              | Numeric limits, pattern sample, format name                           | The validator checks string lengths and patterns. Formivue asserts registered formats by default and can use the annotation profile. Compatible inputs receive known format types.         |
| `properties`, `patternProperties`, `dependentSchemas`                      | Named schema entries opened from the inspector and tree               | The validator checks the matching schemas. The compiler includes them when resolving a bound property.                                                                                     |
| `required`, `dependentRequired`                                            | Named lists and trigger-to-property lists                             | A missing value is reported at its property path. Unconditional required fields show the required marker.                                                                                  |
| `additionalProperties`, `propertyNames`, `unevaluatedProperties`           | Child schema with object or Boolean form                              | The validator checks extra or unevaluated properties and names. The compiler checks addressability and the naming rules of bound keys.                                                     |
| `minProperties`, `maxProperties`                                           | Nonnegative integer limits                                            | The validator checks property counts at the object path.                                                                                                                                   |
| `items`, `prefixItems`                                                     | Item schema and ordered tuple branches                                | The validator checks each position. The compiler checks possible item types against bound controls.                                                                                        |
| `contains`, `minContains`, `maxContains`, `unevaluatedItems`               | Child schemas and matching-item limits                                | The validator tracks the evaluated item positions and reports invalid extra items at their indices.                                                                                        |
| `minItems`, `maxItems`, `uniqueItems`                                      | Count limits and Boolean selector                                     | The validator checks length and uniqueness. The collection controls receive the supported count limits.                                                                                    |
| `allOf`, `anyOf`, `oneOf`, `not`                                           | Ordered branches and exclusion schema                                 | The validator applies composition. The compiler projects unconditional limits and can build named choices from `oneOf` branches with `const` and `title`.                                  |
| `if`, `then`, `else`                                                       | Separate condition and consequence schemas                            | The validator applies the matching branch and reports data paths. The compiler blocks branches that can make a bound path incompatible.                                                    |
| Boolean schemas                                                            | Schema form selector at every nested schema position                  | `true` accepts all values and `false` rejects all values. A Formivue document still needs an object data model with compatible paths.                                                      |
| `title`, `description`, `default`, `examples`                              | Text and typed-value editors                                          | Variants can override titles and descriptions. New rows can use defaults. Examples can be inserted into test data.                                                                         |
| `readOnly`, `writeOnly`, `deprecated`                                      | Boolean selectors                                                     | The compiled form locks, hides in read mode, or marks the affected controls.                                                                                                               |
| `contentEncoding`, `contentMediaType`, `contentSchema`                     | Media and encoding names, child schema                                | These annotations are preserved for consumers that configure content processing.                                                                                                           |
| `$schema`, `$id`, `$comment`, `$vocabulary`                                | Resource metadata, dialect shortcut and vocabulary URI/required pairs | Dialect and vocabulary declarations are restricted to resource roots. The metaschema checks their shapes.                                                                                  |
| `$defs`, `$anchor`, `$dynamicAnchor`, `$ref`, `$dynamicRef`                | Named definitions, identifiers and links to targets                   | The manager resolves references at validation time. The compiler and tree resolve local targets and report incompatible bindings. Applications can register external resources explicitly. |

To reproduce the official default-dialect validation check, build
`@formivue/json-schema` and run the following command with a local checkout
of the JSON Schema Test Suite. The runner targets the validation cases for
2020-12 with the default format-annotation vocabulary.

```sh
pnpm --filter @formivue/json-schema test:2020 /path/to/JSON-Schema-Test-Suite
```

[Draft 2020-12 core](https://json-schema.org/draft/2020-12/json-schema-core) ·
[Validation vocabulary](https://json-schema.org/draft/2020-12/json-schema-validation) ·
[JSON Schema Test Suite](https://github.com/json-schema-org/JSON-Schema-Test-Suite)
