import { barRadius, numberSetting } from './appearance'
import { chartSchema, categoricalMapping } from './shared'

export const StackedBarChart = chartSchema({
  ...categoricalMapping,
  barMaxWidth: numberSetting(1, 400, '100'),
  barGap: numberSetting(0, 95, '20'),
  barRadius,
})
