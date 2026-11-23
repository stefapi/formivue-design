import { CircleDashedIcon } from '@lucide/vue'
import { CircularBarChart as runtime } from '@formivue-design/charts-runtime'
import { CircularBarChart as schema } from '../../schemas/CircularBarChart'
import { CircularBarChart as locales } from '../../locales/CircularBarChart'
import { createChartMaterial } from '../../shared/material'
import { sliceExample } from '../../shared/examples'

export const CircularBarChart = createChartMaterial({
  name: 'CircularBarChart',
  icon: CircleDashedIcon,
  runtime,
  props: sliceExample,
  schema,
  locales,
})
