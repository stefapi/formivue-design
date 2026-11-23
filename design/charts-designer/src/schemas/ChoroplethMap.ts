import { colorScale, toggleSetting } from './appearance'
import { chartSchema, sliceMapping } from './shared'

export const ChoroplethMap = chartSchema({
  ...sliceMapping,
  colorScale,
  reverseColorScale: toggleSetting(),
})
