# @formivue-design/shadcn-advanced-runtime

Vue components based on the [shadcn-vue catalog](https://www.shadcn-vue.com/docs/components)
and the Formivue renderer for advanced JSON schemas.

| Use         | Components                                      |
| ----------- | ----------------------------------------------- |
| Form inputs | Combobox, Tags Input, Input OTP, Toggle Group   |
| Displays    | Avatar, Badge, Hover Card, Data Table           |
| Layout      | Carousel, Resizable, Scroll Area, Sheet, Drawer |
| Form flows  | Questionnaire, Stepper                          |

Use the named Vue components directly or add `AdvancedMaterials` to the
existing schema registry.

```ts
import { createSchemaField } from '@formivue/vue'
import { Materials } from '@formivue-design/formivue-vue'
import { AdvancedMaterials } from '@formivue-design/shadcn-advanced-runtime'

const { SchemaField } = createSchemaField({
  components: { ...Materials, ...AdvancedMaterials },
})
```

Add `@source '../node_modules/@formivue-design/shadcn-advanced-runtime/dist';`
to your Tailwind 4 entry and use the existing shadcn theme tokens.

Use `AdvancedPreviewFrame` around a size-constrained preview to keep advanced
menus and dialogs inside that preview. The frame supplies its own scroll area.

For a Questionnaire or Stepper schema, use void child fields named with stable
IDs and use `QuestionnaireStep` or `StepperStep` as their component. Each step
can contain regular form fields. Branches live in the step's component props.
For example, `[{ "path": "accountType", "equals": "personal", "next": "review" }]`
skips to the step named `review` when the form value matches.

Provide a callback through the Vue `complete` event or the `onSubmit`
component prop. The prop can reference a callback via a schema expression
such as `{{submit}}` in the schema scope. The flow calls it after validating
the reachable steps and passes the entire form snapshot. A rejected promise
keeps the final step open so the action can be retried.
