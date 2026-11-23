import { CircleGaugeIcon } from '@lucide/vue'
import { RadialBarChart as runtime } from '@formivue-design/charts-runtime'
import { RadialBarChart as schema } from '../../schemas/RadialBarChart'
import { RadialBarChart as locales } from '../../locales/RadialBarChart'
import { createChartMaterial } from '../../shared/material'
import { sliceExample } from '../../shared/examples'

export const RadialBarChart = createChartMaterial({
  name: 'RadialBarChart',
  icon: CircleGaugeIcon,
  runtime,
  props: sliceExample,
  schema,
  locales,
})
