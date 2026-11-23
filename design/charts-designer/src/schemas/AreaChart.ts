import {
  curve,
  numberSetting,
  toggleSetting,
  whenUnchecked,
} from './appearance'
import { chartSchema, categoricalMapping } from './shared'

export const AreaChart = chartSchema({
  ...categoricalMapping,
  curve,
  fillOpacity: numberSetting(0, 100, '20'),
  showOutline: toggleSetting(true),
  lineWidth: numberSetting(1, 20, '2', whenUnchecked('showOutline')),
})
