import { mapMarkers, numberSetting } from './appearance'
import { chartSchema, axis } from './shared'

export const FlowMap = chartSchema({
  xKey: axis(),
  latitudeKey: axis(true),
  longitudeKey: axis(true),
  destinationLatitudeKey: axis(true),
  destinationLongitudeKey: axis(true),
  valueKey: axis(true),
  ...mapMarkers,
  linkWidth: numberSetting(1, 20, '2'),
})
