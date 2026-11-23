import { circularScale, numberSetting } from './appearance'
import { chartSchema, sliceMapping } from './shared'

export const CircularBarChart = chartSchema({
  ...sliceMapping,
  ...circularScale,
  petalGap: numberSetting(0, 32, 'Auto'),
  innerRadius: numberSetting(0, 120, 'Auto'),
  sliceRadius: numberSetting(0, 32, 'Auto'),
})
