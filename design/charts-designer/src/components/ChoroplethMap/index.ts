import { MapIcon } from '@lucide/vue'
import { ChoroplethMap as runtime } from '@formivue-design/charts-runtime'
import { ChoroplethMap as schema } from '../../schemas/ChoroplethMap'
import { ChoroplethMap as locales } from '../../locales/ChoroplethMap'
import { createChartMaterial } from '../../shared/material'

export const ChoroplethMap = createChartMaterial({
  name: 'ChoroplethMap',
  icon: MapIcon,
  runtime,
  props: {
    rows: [
      { country: 'FR', value: 23 },
      { country: 'ES', value: 14 },
    ],
    xKey: 'country',
    valueKey: 'value',
  },
  schema,
  locales,
})
