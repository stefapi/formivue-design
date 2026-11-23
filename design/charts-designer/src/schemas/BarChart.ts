import { barRadius, numberSetting } from './appearance'
import { chartSchema, categoricalMapping } from './shared'

export const BarChart = chartSchema({
  ...categoricalMapping,
  groupGap: numberSetting(0, 95, '20'),
  barGap: numberSetting(0, 95, '10'),
  barRadius,
})
