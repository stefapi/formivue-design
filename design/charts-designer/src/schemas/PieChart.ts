import { numberSetting, sliceRadius } from './appearance'
import { chartSchema, periodSliceMapping } from './shared'

export const PieChart = chartSchema({
  ...periodSliceMapping,
  sliceGap: numberSetting(0, 30, '0'),
  sliceRadius,
})
