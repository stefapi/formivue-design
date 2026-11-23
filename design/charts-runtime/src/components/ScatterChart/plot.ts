import VisAxis from '@unovis/vue/components/axis'
import VisScatter, { VisScatterSelectors } from '@unovis/vue/components/scatter'
import VisTooltip from '@unovis/vue/components/tooltip'
import VisXYContainer from '@unovis/vue/containers/xy-container'
import { h } from 'vue'
import { num, read } from '../../shared/row-data'
import { tip, type ChartView } from '../../shared/special-view'
import type { ChartOptions } from '../../shared/base'
import { valueAxis } from '../../shared/value-axis'

export function plot(options: ChartOptions): ChartView {
  const { rows, xKey, valueKey, valueLabel, height, color } = options
  const data = rows.flatMap((row) => {
    const x = num(read(row, xKey))
    const y = num(read(row, valueKey))
    return x === undefined || y === undefined ? [] : [{ x, y }]
  })
  return {
    headers: [xKey, valueKey],
    records: data.map(({ x, y }) => [String(x), valueLabel(y)]),
    plot: data.length
      ? h(VisXYContainer, { data, height, duration: 0 }, () => [
          h(VisScatter, {
            x: (p: (typeof data)[number]) => p.x,
            y: (p: (typeof data)[number]) => p.y,
            color: color(0),
            size: options.pointSize ?? 8,
            shape: options.pointShape ?? 'circle',
          }),
          h(VisAxis, { type: 'x', gridLine: false }),
          valueAxis(valueLabel),
          h(VisTooltip, {
            triggers: {
              [VisScatterSelectors.point]: (p: (typeof data)[number]) =>
                tip(`${xKey}: ${p.x}`, `${valueKey}: ${valueLabel(p.y)}`),
            },
          }),
        ])
      : undefined,
  }
}
