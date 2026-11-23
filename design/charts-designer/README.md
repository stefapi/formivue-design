# @formivue-design/charts-designer

Register `ChartDesignerComponents` with `ComponentTreeWidget`, add the groups
in `ChartSources` to `ResourceWidget`, and register `ChartSettingsComponents`
with `SettingsForm`. The runtime preview uses `ChartMaterials` from
`@formivue-design/charts-runtime`.

Each chart has a material in `src/components`, a property schema in
`src/schemas`, and translated labels in `src/locales`. The component name
matches the key used in JSON. Add `@source` entries for both chart packages'
`dist` directories to your Tailwind entry.

Charts can use an ArrayTable, a JSON array, or an expression. Select the
component first, then map the columns shown in its properties. The canvas uses
ArrayTable default rows, and the preview uses runtime form values.

When an ArrayTable is selected as the data source, renaming the table or one
of its fields updates the linked charts. Column renames also update the keys
in the table's default rows. JSON exports contain the updated link and mapping.

Set a group column to create a series for each distinct group. Choose a numeric
value column and use **Sum** or **Mean** when several rows have the same
category and group. Clearing the group column restores the configured series.

Bar, line, and area charts share the same series mapping. For pie and donut
charts, pick a category column and a numeric value column. Sum or average
multiple rows in each category. Only positive values produce slices, and the
data table retains zero and negative values.

Use **Category order** to keep the source order or sort categories ascending
or descending. **Value format** applies decimal, euro, or percentage
formatting to the Y axis, tooltip, and data table. Choose the number of decimal
places for these formats. Percentages use ratios, so `0.25` displays as `25%`
when the number of decimal places is zero.

Additional graph types use the same data-source selector and show the column
settings for their mapping. For Sankey, choose a source, destination and numeric
measure. For Heatmap, choose a column category, a row category and a measure.
Timeline takes a lane and the start and end dates. Geographic charts take GPS
coordinates or ISO country codes, depending on the selected type.
