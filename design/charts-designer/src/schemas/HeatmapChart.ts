import { colorScale, numberSetting, toggleSetting } from './appearance'
import { chartSchema, hierarchyMapping } from './shared'

export const HeatmapChart = chartSchema({
  ...hierarchyMapping,
  colorScale,
  cellGap: numberSetting(0, 32, '2'),
  cellRadius: numberSetting(0, 24, '2'),
  showGridLabels: toggleSetting(true),
})
