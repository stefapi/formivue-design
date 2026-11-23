import { numberSetting, sliceRadius } from './appearance'
import { chartSchema, sliceMapping } from './shared'

export const PieChart = chartSchema({
  ...sliceMapping,
  sliceGap: numberSetting(0, 30, '0'),
  sliceRadius,
})
