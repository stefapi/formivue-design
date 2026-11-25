# @formivue-design/shadcn-advanced-designer

Add `AdvancedDesignerComponents` to the `ComponentTreeWidget` registry and
use the `inputs`, `displays`, and `layouts` groups from `AdvancedSources` with
`ResourceWidget`. Use `AdvancedMaterials` from
`@formivue-design/shadcn-advanced-runtime` with the preview registry.
Register the [advanced document contracts](../data-schema-advanced/README.md)
for data model generation and document compilation.

The package follows the standard materials source layout. Each material defines
its behavior and palette source under `src/components`. Its property schema
and translations live under `src/schemas` and `src/locales` and are available as
`AdvancedSchemas` and `AdvancedLocales`.

For Questionnaire and Stepper, add a step from the canvas and give it a
stable **Name** in the property panel. Branches use these names as targets.
For layout components with panels or slides, add children to the corresponding
panel or slide on the canvas. All panels are visible while editing.

The [designer playground](../../examples/designer-playground) demonstrates
these registrations. Run `pnpm start:playground` and select **Advanced**.
Include the designer package's `dist` in the app's Tailwind source list.
