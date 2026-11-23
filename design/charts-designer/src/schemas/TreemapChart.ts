import { numberSetting, settingValue, toggleSetting } from './appearance'
import { chartSchema, hierarchyMapping } from './shared'

export const TreemapChart = chartSchema({
  ...hierarchyMapping,
  tileGap: numberSetting(0, 32, '2'),
  tileRadius: numberSetting(0, 24, '2'),
  showGroupLabels: toggleSetting(false, `!${settingValue('groupKey')}`),
})
