import { ChoroplethMap as schema } from '../schemas/ChoroplethMap'
import { chartLocales } from './settings'

export const ChoroplethMap = chartLocales('ChoroplethMap', schema, {
  xKey: [
    'Country code column (ISO alpha-2)',
    'Colonne du code pays (ISO alpha-2)',
    'Columna del código de país (ISO alfa-2)',
  ],
})
