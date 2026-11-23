import { TimelineChart as schema } from '../schemas/TimelineChart'
import { chartLocales } from './settings'

export const TimelineChart = chartLocales('TimelineChart', schema, {
  xKey: ['Lane column', 'Colonne des bandes', 'Columna de filas'],
  lineWidth: [
    'Interval thickness (px)',
    'Épaisseur des intervalles (px)',
    'Grosor de los intervalos (px)',
  ],
})
