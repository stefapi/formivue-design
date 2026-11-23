import { centerLabel, circularScale, numberSetting } from './appearance'
import { chartSchema, sliceMapping } from './shared'

export const RadialBarChart = chartSchema({
  ...sliceMapping,
  ...circularScale,
  trackWidth: numberSetting(1, 64, '16'),
  trackGap: numberSetting(0, 32, '4'),
  centerLabel,
})
