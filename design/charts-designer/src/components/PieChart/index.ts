import { ChartPieIcon } from '@lucide/vue'
import { PieChart as runtime } from '@formivue-design/charts-runtime'
import { PieChart as schema } from '../../schemas/PieChart'
import { PieChart as locales } from '../../locales/PieChart'
import { createChartMaterial } from '../../shared/material'
import { sliceExample } from '../../shared/examples'

export const PieChart = createChartMaterial({
  name: 'PieChart',
  icon: ChartPieIcon,
  runtime,
  props: sliceExample,
  schema,
  locales,
})
