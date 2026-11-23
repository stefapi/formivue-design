import VisCircularBar, {
  VisCircularBarSelectors,
} from '@unovis/vue/components/circular-bar'
import VisNestedDonut, {
  VisNestedDonutSelectors,
} from '@unovis/vue/components/nested-donut'
import VisRadialBar, {
  VisRadialBarSelectors,
} from '@unovis/vue/components/radial-bar'
import VisTooltip from '@unovis/vue/components/tooltip'
import VisTreemap, { VisTreemapSelectors } from '@unovis/vue/components/treemap'
import { h } from 'vue'
import { categoryOrder, pairs } from './special-data'
import { tip, single, type ChartView } from './special-view'
import type { ChartOptions } from './base'

export function weightedChart(
  options: ChartOptions & {
    type: 'treemap' | 'nested-donut' | 'radial-bar' | 'circular-bar'
  },
): ChartView {
  const { type, xKey, groupKey, valueKey, valueLabel, height, color } = options
  const hierarchical =
    (type === 'treemap' || type === 'nested-donut') && !!groupKey
  const records = pairs(options, xKey, hierarchical ? groupKey : '')
  const categories = categoryOrder(
    new Set(records.map(({ first }) => first)),
    options.categoryOrder,
  )
  const order = new Map(categories.map((name, index) => [name, index]))
  if (options.categoryOrder !== 'source')
    records.sort((a, b) => order.get(a.first) - order.get(b.first))
  const positive = records.filter(({ value }) => value > 0)
  type Point = (typeof positive)[number]
  const value = (point: Point) => point.value
  const layers = hierarchical
    ? [(p: Point) => p.second, (p: Point) => p.first]
    : [(p: Point) => p.first]
  return {
    headers: hierarchical ? [groupKey, xKey, valueKey] : [xKey, valueKey],
    records: records.map((point) =>
      hierarchical
        ? [point.second, point.first, valueLabel(point.value)]
        : [point.first, valueLabel(point.value)],
    ),
    message: records.some((point) => point.value < 0)
      ? 'The chart displays positive values only.'
      : undefined,
    plot: positive.length
      ? single(height, positive, () => {
          if (type === 'treemap')
            return [
              h(VisTreemap, {
                value,
                layers,
                id: (point: Point) => point.id,
                numberFormat: valueLabel,
                tilePadding: options.tileGap ?? 2,
                tileBorderRadius: options.tileRadius ?? 2,
                labelInternalNodes: hierarchical && options.showGroupLabels,
                tilePaddingTop:
                  hierarchical && options.showGroupLabels ? 18 : undefined,
              }),
              h(VisTooltip, {
                triggers: {
                  [VisTreemapSelectors.tileGroup]: (tile: {
                    data: { key: string }
                    value: number
                  }) => tip(tile.data.key, valueLabel(tile.value)),
                },
              }),
            ]
          if (type === 'nested-donut')
            return [
              h(VisNestedDonut, {
                value,
                layers,
                layerPadding: options.layerGap ?? 0,
                showSegmentLabels: options.showSegmentLabels,
                centralLabel: options.centerLabel,
              }),
              h(VisTooltip, {
                triggers: {
                  [VisNestedDonutSelectors.segment]: (segment: {
                    data: { key: string }
                    value: number
                  }) => tip(segment.data.key, valueLabel(segment.value)),
                },
              }),
            ]
          const barTooltip = (datum: { data: Point }) =>
            tip(datum.data.first, valueLabel(datum.data.value))
          const props = {
            value,
            maxValue: options.scaleMax > 0 ? options.scaleMax : undefined,
            showBackground: options.showTracks,
            color: (_: Point, index: number) => color(index),
            sortFunction: (a: Point, b: Point) =>
              order.get(a.first) - order.get(b.first),
          }
          return type === 'radial-bar'
            ? [
                h(VisRadialBar, {
                  ...props,
                  trackWidth: options.trackWidth ?? 16,
                  trackPadding: options.trackGap ?? 4,
                  centralLabel: options.centerLabel,
                }),
                h(VisTooltip, {
                  triggers: { [VisRadialBarSelectors.bar]: barTooltip },
                }),
              ]
            : [
                h(VisCircularBar, {
                  ...props,
                  innerRadius: options.innerRadius,
                  barPadding: options.petalGap,
                  cornerRadius: options.sliceRadius,
                }),
                h(VisTooltip, {
                  triggers: { [VisCircularBarSelectors.bar]: barTooltip },
                }),
              ]
        })
      : undefined,
  }
}
