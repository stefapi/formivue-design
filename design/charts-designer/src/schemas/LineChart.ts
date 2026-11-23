import {
  curve,
  numberSetting,
  toggleSetting,
  whenUnchecked,
} from './appearance'
import { chartSchema, categoricalMapping } from './shared'

export const LineChart = chartSchema({
  ...categoricalMapping,
  curve,
  lineWidth: numberSetting(1, 20, '2'),
  showPoints: toggleSetting(true),
  pointSize: numberSetting(1, 40, '5', whenUnchecked('showPoints')),
})
