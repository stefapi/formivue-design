# @formivue-design/charts-runtime

Use the named Vue components directly or merge `ChartMaterials` into your
`createSchemaField({ components })` registry. The schema uses the component
name as `x-component`, and passes the mapping in `x-component-props`.

Add `@source '../node_modules/@formivue-design/charts-runtime/dist';` to your
Tailwind entry for the chart presentation classes.

Each chart is a void field. Use `BarChart`, `LineChart`, or `AreaChart` with
`rows`, `xKey`, and `series: [{ key, title }]`. A `rows` expression can point to the values
of an ArrayTable, for example `{{ $values.sales }}`. Numeric series values
and categories are matched by row, in the order provided by the source.

For a chart with one series per group, set `groupKey` to the grouping column,
`valueKey` to the numeric column, and `aggregation` to `'sum'` (the default)
or `'mean'`. For example, with `xKey: 'month'`, `groupKey: 'channel'`, and
`valueKey: 'amount'`, each channel is a series with one value per month.
Categories and groups follow their first occurrence in `rows`. Missing or
non-numeric values are excluded from the aggregation. A category and group
without any numeric values leave a gap.

For `PieChart` and `DonutChart`, use `xKey` for the slice categories and `valueKey`
for the measure. `aggregation` combines repeated categories. Only positive
results produce slices. The data table keeps all category values.

`categoryOrder` accepts `'source'` (the default), `'ascending'`, and
`'descending'`. Sorting categories preserves the values of every series.
`valueFormat` accepts `'auto'` (the default), `'decimal'`, `'euro'`, and
`'percent'`. The explicit formats use the environment's locale and
`decimalPlaces` (2 by default) for the Y axis, tooltip, and data table.
Percentage values use ratios such as `0.25` for 25 percent.

Additional component names and their column mappings are listed below. All
accept the same `rows` prop, including live data from an ArrayTable.

| Type                                        | Column mapping                                                                                                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `StackedBarChart`                           | The same category and series mapping as bar charts                                                                                                                    |
| `ScatterChart`                              | Numeric `xKey` and `valueKey`                                                                                                                                         |
| `BoxplotChart`                              | Category `xKey` and one numeric sample per row in `valueKey`. Whiskers show the minimum and maximum                                                                   |
| `TimelineChart`                             | Lane `xKey`, `startKey`, and `endKey`. Dates use ISO strings or epoch milliseconds                                                                                    |
| `SankeyChart`, `ChordChart`, `NetworkGraph` | `sourceKey`, `targetKey`, and positive `valueKey`. A graph with no measure counts rows. Sankey requires acyclic flows                                                 |
| `HeatmapChart`                              | Column `xKey`, row `groupKey`, and numeric `valueKey`                                                                                                                 |
| `TreemapChart`, `NestedDonutChart`          | Category `xKey`, optional parent `groupKey`, and positive `valueKey`                                                                                                  |
| `RadialBarChart`, `CircularBarChart`        | Category `xKey` and positive `valueKey`                                                                                                                               |
| `PointMap`                                  | `latitudeKey`, `longitudeKey`, optional name `xKey` and measure `valueKey`                                                                                            |
| `ChoroplethMap`                             | Two-letter ISO country code `xKey` and numeric `valueKey`                                                                                                             |
| `FlowMap`                                   | Origin and destination coordinate columns using `latitudeKey`, `longitudeKey`, `destinationLatitudeKey`, and `destinationLongitudeKey`. Name and measure are optional |

Geographic types use a bundled world map. Where a type combines repeated
categories or pairs, `aggregation` chooses the sum or mean.
