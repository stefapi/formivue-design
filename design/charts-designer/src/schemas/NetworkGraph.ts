import {
  choiceSetting,
  numberSetting,
  showNodeLabels,
  toggleSetting,
} from './appearance'
import { chartSchema, linkMapping, aggregation } from './shared'

export const NetworkGraph = chartSchema({
  ...linkMapping,
  aggregation: aggregation('!$values["x-component-props"]?.valueKey'),
  graphLayout: choiceSetting(['circular', 'concentric', 'force']),
  nodeSize: numberSetting(4, 80, '30'),
  linkWidth: numberSetting(1, 20, '1'),
  showNodeLabels,
  showArrows: toggleSetting(true),
})
