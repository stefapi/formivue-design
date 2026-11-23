import { PointMap as schema } from '../schemas/PointMap'
import { chartLocales } from './settings'

export const PointMap = chartLocales('PointMap', schema, {
  xKey: [
    'Point label column',
    'Colonne du libellé des points',
    'Columna de etiquetas de los puntos',
  ],
})
