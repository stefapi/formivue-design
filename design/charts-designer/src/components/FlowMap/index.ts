import { RouteIcon } from '@lucide/vue'
import { FlowMap as runtime } from '@formivue-design/charts-runtime'
import { FlowMap as schema } from '../../schemas/FlowMap'
import { FlowMap as locales } from '../../locales/FlowMap'
import { createChartMaterial } from '../../shared/material'

export const FlowMap = createChartMaterial({
  name: 'FlowMap',
  icon: RouteIcon,
  runtime,
  props: {
    rows: [
      {
        label: 'Paris–Lisbon',
        lat: 48.86,
        lon: 2.35,
        toLat: 38.72,
        toLon: -9.14,
        value: 12,
      },
    ],
    xKey: 'label',
    latitudeKey: 'lat',
    longitudeKey: 'lon',
    destinationLatitudeKey: 'toLat',
    destinationLongitudeKey: 'toLon',
    valueKey: 'value',
  },
  schema,
  locales,
})
