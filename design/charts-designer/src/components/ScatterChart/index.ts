import { ChartScatterIcon } from '@lucide/vue'
import { ScatterChart as runtime } from '@formivue-design/charts-runtime'
import { ScatterChart as schema } from '../../schemas/ScatterChart'
import { ScatterChart as locales } from '../../locales/ScatterChart'
import { createChartMaterial } from '../../shared/material'

export const ScatterChart = createChartMaterial({
  name: 'ScatterChart',
  icon: ChartScatterIcon,
  runtime,
  props: {
    rows: [
      { x: 1, y: 8 },
      { x: 2, y: 5 },
      { x: 3, y: 12 },
      { x: 4, y: 9 },
    ],
    xKey: 'x',
    valueKey: 'y',
  },
  schema,
  locales,
})
