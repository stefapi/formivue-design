import { MapPinIcon } from '@lucide/vue'
import { PointMap as runtime } from '@formivue-design/charts-runtime'
import { PointMap as schema } from '../../schemas/PointMap'
import { PointMap as locales } from '../../locales/PointMap'
import { createChartMaterial } from '../../shared/material'
import { pointExample } from '../../shared/examples'

export const PointMap = createChartMaterial({
  name: 'PointMap',
  icon: MapPinIcon,
  runtime,
  props: pointExample,
  schema,
  locales,
})
