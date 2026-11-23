import { BoxplotChart as schema } from '../schemas/BoxplotChart'
import { chartLocales } from './settings'

export const BoxplotChart = chartLocales('BoxplotChart', schema, {
  valueKey: [
    'Sample column',
    'Colonne des observations',
    'Columna de observaciones',
  ],
})
