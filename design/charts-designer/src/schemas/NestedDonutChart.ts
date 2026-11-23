import {
  centerLabel,
  numberSetting,
  settingValue,
  toggleSetting,
} from './appearance'
import { chartSchema, hierarchyMapping } from './shared'

export const NestedDonutChart = chartSchema({
  ...hierarchyMapping,
  layerGap: numberSetting(0, 32, '0', `!${settingValue('groupKey')}`),
  showSegmentLabels: toggleSetting(true),
  centerLabel,
})
