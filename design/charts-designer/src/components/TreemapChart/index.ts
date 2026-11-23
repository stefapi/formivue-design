import { LayoutGridIcon } from '@lucide/vue'
import { TreemapChart as runtime } from '@formivue-design/charts-runtime'
import { TreemapChart as schema } from '../../schemas/TreemapChart'
import { TreemapChart as locales } from '../../locales/TreemapChart'
import { createChartMaterial } from '../../shared/material'
import { hierarchyExample } from '../../shared/examples'

export const TreemapChart = createChartMaterial({
  name: 'TreemapChart',
  icon: LayoutGridIcon,
  runtime,
  props: hierarchyExample,
  schema,
  locales,
})
