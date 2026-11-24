import {
  chartAppearance,
  chartDataColumns,
  validateChartRows,
} from '@formivue-design/charts-runtime/data-contract'
import type { DocumentContractExtension } from '@formivue-design/formivue-transformer'

export const chartDocumentContracts: DocumentContractExtension = {
  name: 'charts',
  components: Object.fromEntries(
    Object.keys(chartAppearance).map((component) => {
      const chart = component as keyof typeof chartAppearance
      return [
        chart,
        (props) => ({
          kind: 'void',
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
