import VisAxis from '@unovis/vue/components/axis'
import VisBoxplot, { VisBoxplotSelectors } from '@unovis/vue/components/boxplot'
import VisTooltip from '@unovis/vue/components/tooltip'
import VisXYContainer from '@unovis/vue/containers/xy-container'
import { h } from 'vue'
import { categoryOrder, distribution } from '../../shared/special-data'
import { label, num, read } from '../../shared/row-data'
import { tip, type ChartView } from '../../shared/special-view'
import type { ChartOptions } from '../../shared/base'
import { valueAxis } from '../../shared/value-axis'
import { chartLanguageIndex } from '../../shared/locale'

export function plot(options: ChartOptions): ChartView {
  const { rows, xKey, valueKey, valueLabel, height, color } = options
  const samples = new Map<string, number[]>()
  for (const row of rows) {
    const category = label(read(row, xKey))
    const value = num(read(row, valueKey))
    if (category === undefined || value === undefined) continue
    const bucket = samples.get(category)
    if (bucket) bucket.push(value)
    else samples.set(category, [value])
  }
  const data = categoryOrder(samples.keys(), options.categoryOrder).map(
    (category, index) => ({
      category,
      index,
      ...distribution(samples.get(category)),
    }),
  )
  type Box = (typeof data)[number]
  const median = ['Median', 'Médiane', 'Mediana'][
    chartLanguageIndex(options.locale)
  ]
  const statistics = ['Min', 'Q1', median, 'Q3', 'Max']
  const values = (box: Box) =>
    [
      box.whiskers[0],
      box.quartiles[0],
      box.median,
      box.quartiles[1],
      box.whiskers[1],
    ].map(valueLabel)
  return {
    headers: [xKey, ...statistics],
    records: data.map((box) => [box.category, ...values(box)]),
    plot: data.length
      ? h(VisXYContainer, { data, height, duration: 0 }, () => [
          h(VisBoxplot, {
            x: (d: Box) => d.index,
            median: (d: Box) => d.median,
            quartiles: (d: Box) => d.quartiles,
            whiskers: (d: Box) => d.whiskers,
            color: color(0),
            dataStep: 1,
            barMaxWidth: options.boxWidth,
            roundedCorners: options.barRadius ?? 2,
          }),
          h(VisAxis, {
            type: 'x',
            tickValues: data.map(({ index }) => index),
            tickFormat: (index) => data[Number(index)]?.category ?? '',
            gridLine: false,
          }),
          valueAxis(valueLabel),
          h(VisTooltip, {
            triggers: {
              [VisBoxplotSelectors.boxGroup]: (d: Box) =>
                tip(d.category, statistics.join(' · '), values(d).join(' · ')),
            },
          }),
        ])
      : undefined,
  }
}
