import {
  chartColumnProperties,
  chartDataContracts,
  chartDataColumns,
  validateChartRows,
} from '@formivue-design/charts-runtime/data-contract'
import type {
  DocumentComponentContract,
  DocumentContractExtension,
} from '@formivue-design/formivue-transformer'
import { isJsonObject, type JsonObject } from '@formivue/json-schema'
import {
  compileChartFilters,
  filterColumns,
  migrateChartFilters,
  renameFilterBinding,
} from './filters'

const renameChartProps: DocumentComponentContract['renameProps'] = (
  props,
  { renameColumn, renameBinding },
) => {
  const next = { ...props }
  const column = (key: string) => renameColumn('rows', key)
  let changed = false
  for (const property of chartColumnProperties) {
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
      if (!isJsonObject(entry) || typeof entry[key] !== 'string') return entry
      const value = column(entry[key])
      const bound =
        property === 'filters'
          ? renameFilterBinding(entry, renameBinding)
          : entry
      if (bound === entry && value === entry[key]) return entry
      changed = true
      return { ...bound, [key]: value }
    })
  }
  return changed ? next : props
}

export const chartDocumentContracts: DocumentContractExtension = {
  name: 'charts',
  components: Object.fromEntries(
    Object.keys(chartDataContracts.charts).map((component) => {
      const chart = component as keyof typeof chartDataContracts.charts
      return [
        chart,
        (props: JsonObject): DocumentComponentContract => {
          const mapping = chartDataColumns(chart, props)
          return {
            kind: 'void',
            normalizeProps: migrateChartFilters,
            compileProps: compileChartFilters,
            renameProps: renameChartProps,
            allowsBinding: (property) =>
              property !== 'columns' &&
              property !== 'series' &&
              property !== 'filters' &&
              !property.endsWith('Key'),
            bindings: {
              rows: {
                required: true,
                rows: {
                  ...mapping,
                  columns: [...mapping.columns, ...filterColumns(props)],
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
          }
        },
      ]
    }),
  ),
}
