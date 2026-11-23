import { ScatterChart as schema } from '../schemas/ScatterChart'
import { chartLocales } from './settings'

export const ScatterChart = chartLocales('ScatterChart', schema, {
  xKey: ['X axis column', 'Colonne de l’axe X', 'Columna del eje X'],
  valueKey: ['Y axis column', 'Colonne de l’axe Y', 'Columna del eje Y'],
})
