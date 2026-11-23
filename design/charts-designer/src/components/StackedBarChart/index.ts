import { ChartNoAxesColumnIncreasingIcon } from '@lucide/vue'
import { StackedBarChart as runtime } from '@formivue-design/charts-runtime'
import { StackedBarChart as schema } from '../../schemas/StackedBarChart'
import { StackedBarChart as locales } from '../../locales/StackedBarChart'
import { createChartMaterial } from '../../shared/material'
import { seriesExample } from '../../shared/examples'

export const StackedBarChart = createChartMaterial({
  name: 'StackedBarChart',
  icon: ChartNoAxesColumnIncreasingIcon,
  runtime,
  props: seriesExample,
  schema,
  locales,
})
