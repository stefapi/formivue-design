import { barRadius, numberSetting } from './appearance'
import { chartSchema, axis, categoryOrder } from './shared'

export const BoxplotChart = chartSchema({
  xKey: axis(),
  valueKey: axis(true),
  categoryOrder,
  boxWidth: numberSetting(1, 400, 'Auto'),
  barRadius,
})
