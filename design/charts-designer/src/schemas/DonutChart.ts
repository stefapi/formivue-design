import { centerLabel, numberSetting, sliceRadius } from './appearance'
import { chartSchema, periodSliceMapping } from './shared'

export const DonutChart = chartSchema({
  ...periodSliceMapping,
  ringWidth: numberSetting(1, 100, 'Auto'),
  sliceGap: numberSetting(0, 30, '0'),
  sliceRadius,
  centerLabel,
})
