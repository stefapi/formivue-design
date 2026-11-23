import VisAxis from '@unovis/vue/components/axis'
import VisTimeline, {
  VisTimelineSelectors,
} from '@unovis/vue/components/timeline'
import VisTooltip from '@unovis/vue/components/tooltip'
import VisXYContainer from '@unovis/vue/containers/xy-container'
import { h } from 'vue'
import { categoryOrder } from '../../shared/special-data'
import { epoch, label, orderedInterval, read } from '../../shared/row-data'
import { tip, type ChartView } from '../../shared/special-view'
import type { ChartOptions } from '../../shared/base'

export function plot(options: ChartOptions): ChartView {
  const { rows, xKey, startKey, endKey, height, color } = options
  const data = rows.flatMap((row) => {
    const lane = label(read(row, xKey))
    const start = epoch(read(row, startKey))
    const end = epoch(read(row, endKey))
    return lane === undefined ||
      start === undefined ||
      end === undefined ||
      !orderedInterval(start, end)
      ? []
      : [{ lane, start, end }]
  })
  const includesTime = data.some(
    ({ start, end }) => start % 86400000 !== 0 || end % 86400000 !== 0,
  )
  const dates = new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: includesTime ? 'short' : undefined,
  })
  const displayDate = (date: number) => dates.format(date)
  type Interval = (typeof data)[number]
  const lanes = categoryOrder(
    new Set(data.map(({ lane }) => lane)),
    options.categoryOrder,
  )
  const ranks = new Map(lanes.map((lane, index) => [lane, index]))
  if (options.categoryOrder !== 'source')
    data.sort((a, b) => ranks.get(a.lane) - ranks.get(b.lane))
  return {
    headers: [xKey, startKey, endKey],
    records: data.map(({ lane, start, end }) => [
      lane,
      displayDate(start),
      displayDate(end),
    ]),
    plot: data.length
      ? h(VisXYContainer, { data, height, duration: 0 }, () => [
          h(VisTimeline, {
            x: (d: Interval) => d.start,
            length: (d: Interval) => d.end - d.start,
            type: (d: Interval) => d.lane,
            lineRow: (d: Interval) => d.lane,
            showRowLabels: options.showRowLabels,
            lineCap: options.roundIntervals,
            lineWidth: options.lineWidth ?? 8,
            color: (d: Interval) => color(ranks.get(d.lane)),
            rowHeight: options.rowHeight ?? 28,
          }),
          h(VisAxis, {
            type: 'x',
            tickFormat: (tick) => displayDate(Number(tick)),
            gridLine: false,
          }),
          h(VisTooltip, {
            triggers: {
              [VisTimelineSelectors.lineGroup]: (d: Interval) =>
                tip(d.lane, `${displayDate(d.start)} → ${displayDate(d.end)}`),
            },
          }),
        ])
      : undefined,
  }
}
