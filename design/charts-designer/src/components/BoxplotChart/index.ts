import { ChartColumnIcon } from '@lucide/vue'
import { BoxplotChart as runtime } from '@formivue-design/charts-runtime'
import { BoxplotChart as schema } from '../../schemas/BoxplotChart'
import { BoxplotChart as locales } from '../../locales/BoxplotChart'
import { createChartMaterial } from '../../shared/material'

export const BoxplotChart = createChartMaterial({
  name: 'BoxplotChart',
  icon: ChartColumnIcon,
  runtime,
  props: {
    rows: [2, 5, 6, 8, 12].map((value) => ({ category: 'Web', value })),
    xKey: 'category',
    valueKey: 'value',
  },
  schema,
  locales,
})
