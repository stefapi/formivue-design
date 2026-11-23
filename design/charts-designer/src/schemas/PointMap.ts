import { mapMarkers } from './appearance'
import { chartSchema, axis } from './shared'

export const PointMap = chartSchema({
  xKey: axis(),
  latitudeKey: axis(true),
  longitudeKey: axis(true),
  valueKey: axis(true),
  ...mapMarkers,
})
