import { ChartNoAxesColumnIcon } from '@lucide/vue'
import { BarChart as runtime } from '@formivue-design/charts-runtime'
import { BarChart as schema } from '../../schemas/BarChart'
import { BarChart as locales } from '../../locales/BarChart'
import { createChartMaterial } from '../../shared/material'
import { seriesExample } from '../../shared/examples'

export const BarChart = createChartMaterial({
  name: 'BarChart',
  icon: ChartNoAxesColumnIcon,
  runtime,
  props: seriesExample,
  schema,
  locales,
})
