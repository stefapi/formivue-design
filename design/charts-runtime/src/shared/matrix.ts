import VisHeatmap, { VisHeatmapSelectors } from '@unovis/vue/components/heatmap'
import VisTooltip from '@unovis/vue/components/tooltip'
import { h } from 'vue'
import { categoryOrder, pairs } from './special-data'
import { tip, single, type ChartView } from './special-view'
import { colorRange } from './appearance'
import type { ChartOptions } from './base'

export function matrixChart(options: ChartOptions): ChartView {
  const { xKey, groupKey, valueKey, valueLabel, height } = options
  const records = groupKey ? pairs(options, xKey, groupKey) : []
  const columns = categoryOrder(
    new Set(records.map(({ first }) => first)),
    options.categoryOrder,
  )
  const rows = categoryOrder(
    new Set(records.map(({ second }) => second)),
    options.categoryOrder,
  )
  const values = new Map(records.map(({ id, value }) => [id, value]))
  const cells = rows.flatMap((second) =>
    columns.map((first) => ({
      first,
      second,
      value: values.get(JSON.stringify([first, second])),
    })),
  )
  return {
    headers: [xKey, groupKey, valueKey],
    records: cells
      .filter(({ value }) => value !== undefined)
      .map(({ first, second, value }) => [first, second, valueLabel(value)]),
    plot: records.length
      ? single(height, cells, () => [
          h(VisHeatmap, {
            layout: 'row',
            numRows: rows.length,
            numColumns: columns.length,
            value: (item: (typeof cells)[number]) => item.value,
            colorRange: colorRange(options.colorScale),
            cellPadding: options.cellGap ?? 2,
            cellCornerRadius: options.cellRadius ?? 2,
            columnLabel: options.showGridLabels
              ? (index: number) => columns[index]
              : undefined,
            rowLabel: options.showGridLabels
              ? (index: number) => rows[index]
              : undefined,
          }),
          h(VisTooltip, {
            triggers: {
              [VisHeatmapSelectors.cell]: ({
                datum,
              }: {
                datum: (typeof cells)[number]
              }) =>
                tip(
                  `${datum.first} · ${datum.second}`,
                  valueLabel(datum.value),
                ),
            },
          }),
        ])
      : undefined,
  }
}
