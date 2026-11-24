import { Table } from '@formivue-design/vue-ui'
import type { NumericAccessor } from '@unovis/ts'
import VisAxis from '@unovis/vue/components/axis'
import VisCrosshair from '@unovis/vue/components/crosshair'
import VisDonut, { VisDonutSelectors } from '@unovis/vue/components/donut'
import VisTooltip from '@unovis/vue/components/tooltip'
import VisSingleContainer from '@unovis/vue/containers/single-container'
import VisXYContainer from '@unovis/vue/containers/xy-container'
import { h, type VNode } from 'vue'
import { chartData } from './categorical-data'
import { categoricalProps, createChart, type ChartOptions } from './base'
import { radians, type ChartName } from './appearance'

type ChartPoint = ReturnType<typeof chartData>['points'][number]
const x = (point: ChartPoint) => point.index
interface Marks {
  x: typeof x
  y: NumericAccessor<ChartPoint>[]
  colors: string[]
}

export function createCategoricalChart(
  name: ChartName,
  marks:
    'pie' | 'donut' | ((data: Marks, options: ChartOptions) => VNode | VNode[]),
  stacked = false,
) {
  const render = (props: ChartOptions) => {
    const circular = typeof marks === 'string'
    const { height, valueLabel, color: chartColor, formatAxis } = props
    const { points, series: sourceSeries } = chartData({ ...props, circular })
    const series = sourceSeries.map(({ title, color }, index) => ({
      title,
      color: color || chartColor(index),
    }))
    const slices = circular ? points.filter(({ values }) => values[0] > 0) : []
    const legend = circular
      ? slices.map(({ label }, index) => ({
          title: label,
          color: chartColor(index),
        }))
      : series
    const hasData =
      props.xKey &&
      points.some(({ label }) => label !== '') &&
      points.some(({ values }) => values.some(Number.isFinite))
    const y: NumericAccessor<ChartPoint>[] = series.map(
      (_, index) => (point) => point.values[index],
    )
    const colors = series.map(({ color }) => color)
    const tooltip = (point: ChartPoint) => {
      const content = document.createElement('div')
      content.className =
        'grid gap-1 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md'
      const title = document.createElement('strong')
      title.textContent = point.label
      content.append(title)
      series.forEach(({ title }, index) => {
        const line = document.createElement('div')
        line.textContent = `${title}: ${valueLabel(point.values[index])}`
        content.append(line)
      })
      return content
    }

    const plot = () => {
      if (circular) {
        if (!slices.length) return null
        return h(
          VisSingleContainer,
          { data: slices, duration: 0, height },
          () => [
            h(VisDonut, {
              value: (point: ChartPoint) => point.values[0],
              color: (_, index) => chartColor(index),
              sortFunction: (a: ChartPoint, b: ChartPoint) => a.index - b.index,
              arcWidth:
                marks === 'pie'
                  ? 0
                  : (props.ringWidth ?? Math.min(32, height / 4)),
              padAngle: radians(props.sliceGap),
              cornerRadius: props.sliceRadius ?? 0,
              centralLabel: props.centerLabel,
              showBackground: false,
            }),
            h(VisTooltip, {
              triggers: {
                [VisDonutSelectors.segment]: (arc: { data: ChartPoint }) =>
                  tooltip(arc.data),
              },
            }),
          ],
        )
      }
      return h(VisXYContainer, { data: points, duration: 0, height }, () => [
        typeof marks === 'function' ? marks({ x, y, colors }, props) : null,
        h(VisAxis, {
          type: 'x',
          tickValues: points.map(x),
          tickFormat: (index: number | Date) =>
            points[Number(index)]?.label ?? '',
          tickTextAdaptiveSets: true,
          gridLine: false,
          domainLine: false,
          tickLine: false,
        }),
        h(VisAxis, {
          type: 'y',
          tickFormat: formatAxis
            ? (value: number | Date) => valueLabel(Number(value))
            : undefined,
          domainLine: false,
          tickLine: false,
        }),
        h(VisCrosshair, {
          x,
          y: stacked ? undefined : y,
          yStacked: stacked ? y : undefined,
          color: colors,
          template: tooltip,
        }),
      ])
    }

    return h(
      'figure',
      { class: 'm-0 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2' },
      [
        h('figcaption', { class: 'text-sm font-medium' }, props.label),
        hasData
          ? [
              h(
                'div',
                {
                  'aria-hidden': true,
                  class: 'min-w-0',
                  style: {
                    '--vis-axis-tick-label-color': 'var(--muted-foreground)',
                    '--vis-axis-grid-color': 'var(--border)',
                    '--vis-tooltip-background-color': 'transparent',
                    '--vis-tooltip-border-color': 'transparent',
                    '--vis-tooltip-padding': '0',
                  },
                },
                [plot()],
              ),
              legend.length
                ? h(
                    'ul',
                    {
                      class:
                        'm-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs',
                    },
                    legend.map(({ title, color }, index) =>
                      h(
                        'li',
                        { key: index, class: 'flex items-center gap-1.5' },
                        [
                          h('span', {
                            'aria-hidden': true,
                            class: 'size-2.5 rounded-xs',
                            style: { backgroundColor: color },
                          }),
                          title,
                        ],
                      ),
                    ),
                  )
                : null,
              circular && !slices.length
                ? h(
                    'p',
                    { class: 'text-sm text-muted-foreground' },
                    props.emptyText,
                  )
                : null,
              circular && points.some(({ values }) => values[0] < 0)
                ? h(
                    'p',
                    { class: 'text-xs text-muted-foreground' },
                    'Slices show positive values only.',
                  )
                : null,
              h('details', { class: 'min-w-0 text-xs' }, [
                h(
                  'summary',
                  { class: 'w-fit cursor-pointer text-muted-foreground' },
                  props.dataLabel,
                ),
                h('div', { class: 'overflow-x-auto' }, [
                  h(Table, {
                    'aria-label': props.dataLabel,
                    columns: [
                      { key: 'label', title: props.xKey },
                      ...series.map(({ title }, index) => ({
                        key: `value${index}`,
                        title,
                      })),
                    ],
                    dataSource: points.map(({ label, index, values }) => ({
                      key: index,
                      label,
                      ...Object.fromEntries(
                        values.map((value, index) => [
                          `value${index}`,
                          valueLabel(value),
                        ]),
                      ),
                    })),
                  }),
                ]),
              ]),
            ]
          : h('p', { class: 'text-sm text-muted-foreground' }, props.emptyText),
      ],
    )
  }
  return createChart(name, render, categoricalProps)
}
