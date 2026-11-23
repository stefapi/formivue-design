import { numberSetting, showNodeLabels } from './appearance'
import { chartSchema, linkMapping, aggregation } from './shared'

export const ChordChart = chartSchema({
  ...linkMapping,
  aggregation: aggregation(),
  nodeWidth: numberSetting(1, 80, '15'),
  sliceGap: numberSetting(0, 30, '≈ 1.15'),
  showNodeLabels,
})
