import { Grid3X3Icon } from '@lucide/vue'
import { HeatmapChart as runtime } from '@formivue-design/charts-runtime'
import { HeatmapChart as schema } from '../../schemas/HeatmapChart'
import { HeatmapChart as locales } from '../../locales/HeatmapChart'
import { createChartMaterial } from '../../shared/material'
import { hierarchyExample } from '../../shared/examples'

export const HeatmapChart = createChartMaterial({
  name: 'HeatmapChart',
  icon: Grid3X3Icon,
  runtime,
  props: hierarchyExample,
  schema,
  locales,
})
