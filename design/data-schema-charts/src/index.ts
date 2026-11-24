import {
  chartAppearance,
  chartDataColumns,
  validateChartRows,
} from '@formivue-design/charts-runtime/data-contract'
import type {
  DocumentComponentContract,
  DocumentContractExtension,
} from '@formivue-design/formivue-transformer'

const chartColumns = [
  'xKey',
  'groupKey',
  'valueKey',
  'sourceKey',
  'targetKey',
  'startKey',
  'endKey',
  'latitudeKey',
  'longitudeKey',
  'destinationLatitudeKey',
  'destinationLongitudeKey',
]

const renameChartProps: DocumentComponentContract['renameProps'] = (
  props,
  { renameColumn },
) => {
  const next = { ...props }
  const column = (key: string) => renameColumn('rows', key)
  let changed = false
  for (const property of chartColumns) {
    const key = props[property]
    if (typeof key !== 'string' || column(key) === key) continue
    next[property] = column(key)
    changed = true
  }
  for (const [property, key] of [
    ['series', 'key'],
    ['filters', 'column'],
  ] as const) {
    const entries = props[property]
    if (!Array.isArray(entries)) continue
    next[property] = entries.map((entry) => {
      if (
        !entry ||
        typeof entry !== 'object' ||
        Array.isArray(entry) ||
        typeof entry[key] !== 'string'
      )
        return entry
      const value = column(entry[key])
      if (value === entry[key]) return entry
      changed = true
      return { ...entry, [key]: value }
    })
  }
  return changed ? next : props
}

export const chartDocumentContracts: DocumentContractExtension = {
  name: 'charts',
  components: Object.fromEntries(
    Object.keys(chartAppearance).map((component) => {
      const chart = component as keyof typeof chartAppearance
      return [
        chart,
        (props) => ({
          kind: 'void',
          renameProps: renameChartProps,
          allowsBinding: (property) =>
            property !== 'columns' &&
            property !== 'series' &&
            !property.endsWith('Key'),
          bindings: {
            rows: {
              required: true,
              rows: {
                ...chartDataColumns(chart, props),
                validate(rows) {
                  const report = validateChartRows(
                    chart,
                    props,
                    rows as Record<string, unknown>[],
                  )
                  return report.cyclic
                    ? [
                        {
                          path: [],
                          code: 'cyclic_chart_flow',
                          message: 'Sankey flows must be acyclic',
                        },
                      ]
                    : report.examples.map(({ row, column, reason }) => ({
                        path: column
                          ? [String(row - 1), column]
                          : [String(row - 1)],
                        code: 'invalid_chart_data',
                        message: `Invalid chart data (${reason})`,
                      }))
                },
              },
            },
          },
        }),
      ]
    }),
  ),
}
