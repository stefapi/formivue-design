import { centerLabel, numberSetting, sliceRadius } from './appearance'
import { chartSchema, sliceMapping } from './shared'

export const DonutChart = chartSchema({
  ...sliceMapping,
  ringWidth: numberSetting(1, 100, 'Auto'),
  sliceGap: numberSetting(0, 30, '0'),
  sliceRadius,
  centerLabel,
})
