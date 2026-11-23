import { NetworkIcon } from '@lucide/vue'
import { NetworkGraph as runtime } from '@formivue-design/charts-runtime'
import { NetworkGraph as schema } from '../../schemas/NetworkGraph'
import { NetworkGraph as locales } from '../../locales/NetworkGraph'
import { createChartMaterial } from '../../shared/material'
import { linkExample } from '../../shared/examples'

export const NetworkGraph = createChartMaterial({
  name: 'NetworkGraph',
  icon: NetworkIcon,
  runtime,
  props: linkExample,
  schema,
  locales,
})
