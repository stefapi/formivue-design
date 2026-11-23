import { numberSetting, toggleSetting } from './appearance'
import { chartSchema, axis, categoryOrder } from './shared'

export const TimelineChart = chartSchema(
  {
    xKey: axis(),
    startKey: axis(),
    endKey: axis(),
    categoryOrder,
    rowHeight: numberSetting(14, 120, '28'),
    lineWidth: numberSetting(1, 60, '8'),
    roundIntervals: toggleSetting(),
    showRowLabels: toggleSetting(true),
  },
  false,
)
