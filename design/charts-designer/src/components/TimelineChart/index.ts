import { CalendarRangeIcon } from '@lucide/vue'
import { TimelineChart as runtime } from '@formivue-design/charts-runtime'
import { TimelineChart as schema } from '../../schemas/TimelineChart'
import { TimelineChart as locales } from '../../locales/TimelineChart'
import { createChartMaterial } from '../../shared/material'

export const TimelineChart = createChartMaterial({
  name: 'TimelineChart',
  icon: CalendarRangeIcon,
  runtime,
  props: {
    rows: [
      { phase: 'Design', start: '2026-11-01', end: '2026-11-04' },
      { phase: 'Build', start: '2026-11-03', end: '2026-11-09' },
    ],
    xKey: 'phase',
    startKey: 'start',
    endKey: 'end',
  },
  schema,
  locales,
})
