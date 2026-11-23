import { ChartLineIcon } from '@lucide/vue'
import { LineChart as runtime } from '@formivue-design/charts-runtime'
import { LineChart as schema } from '../../schemas/LineChart'
import { LineChart as locales } from '../../locales/LineChart'
import { createChartMaterial } from '../../shared/material'
import { seriesExample } from '../../shared/examples'

export const LineChart = createChartMaterial({
  name: 'LineChart',
  icon: ChartLineIcon,
  runtime,
  props: seriesExample,
  schema,
  locales,
})
