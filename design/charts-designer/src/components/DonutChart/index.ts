import { DonutIcon } from '@lucide/vue'
import { DonutChart as runtime } from '@formivue-design/charts-runtime'
import { DonutChart as schema } from '../../schemas/DonutChart'
import { DonutChart as locales } from '../../locales/DonutChart'
import { createChartMaterial } from '../../shared/material'
import { sliceExample } from '../../shared/examples'

export const DonutChart = createChartMaterial({
  name: 'DonutChart',
  icon: DonutIcon,
  runtime,
  props: sliceExample,
  schema,
  locales,
})
