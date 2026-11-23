import { ChartAreaIcon } from '@lucide/vue'
import { AreaChart as runtime } from '@formivue-design/charts-runtime'
import { AreaChart as schema } from '../../schemas/AreaChart'
import { AreaChart as locales } from '../../locales/AreaChart'
import { createChartMaterial } from '../../shared/material'
import { seriesExample } from '../../shared/examples'

export const AreaChart = createChartMaterial({
  name: 'AreaChart',
  icon: ChartAreaIcon,
  runtime,
  props: seriesExample,
  schema,
  locales,
})
