import { Disc3Icon } from '@lucide/vue'
import { NestedDonutChart as runtime } from '@formivue-design/charts-runtime'
import { NestedDonutChart as schema } from '../../schemas/NestedDonutChart'
import { NestedDonutChart as locales } from '../../locales/NestedDonutChart'
import { createChartMaterial } from '../../shared/material'
import { hierarchyExample } from '../../shared/examples'

export const NestedDonutChart = createChartMaterial({
  name: 'NestedDonutChart',
  icon: Disc3Icon,
  runtime,
  props: hierarchyExample,
  schema,
  locales,
})
