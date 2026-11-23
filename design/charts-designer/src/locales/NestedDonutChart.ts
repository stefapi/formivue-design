import { NestedDonutChart as schema } from '../schemas/NestedDonutChart'
import { chartLocales } from './settings'

export const NestedDonutChart = chartLocales('NestedDonutChart', schema, {
  groupKey: [
    'Parent ring column',
    'Colonne des segments parents',
    'Columna de los segmentos principales',
  ],
})
