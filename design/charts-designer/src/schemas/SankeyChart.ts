import { choiceSetting, numberSetting } from './appearance'
import { chartSchema, linkMapping, aggregation } from './shared'

export const SankeyChart = chartSchema({
  ...linkMapping,
  aggregation: aggregation(),
  nodeAlign: choiceSetting(['justify', 'left', 'center', 'right']),
  nodeWidth: numberSetting(1, 80, '25'),
  nodePadding: numberSetting(0, 50, '2'),
})
