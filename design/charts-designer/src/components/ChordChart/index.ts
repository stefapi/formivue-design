import { CableIcon } from '@lucide/vue'
import { ChordChart as runtime } from '@formivue-design/charts-runtime'
import { ChordChart as schema } from '../../schemas/ChordChart'
import { ChordChart as locales } from '../../locales/ChordChart'
import { createChartMaterial } from '../../shared/material'
import { linkExample } from '../../shared/examples'

export const ChordChart = createChartMaterial({
  name: 'ChordChart',
  icon: CableIcon,
  runtime,
  props: linkExample,
  schema,
  locales,
})
