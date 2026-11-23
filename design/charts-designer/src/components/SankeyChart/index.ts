import { WorkflowIcon } from '@lucide/vue'
import { SankeyChart as runtime } from '@formivue-design/charts-runtime'
import { SankeyChart as schema } from '../../schemas/SankeyChart'
import { SankeyChart as locales } from '../../locales/SankeyChart'
import { createChartMaterial } from '../../shared/material'
import { linkExample } from '../../shared/examples'

export const SankeyChart = createChartMaterial({
  name: 'SankeyChart',
  icon: WorkflowIcon,
  runtime,
  props: linkExample,
  schema,
  locales,
})
