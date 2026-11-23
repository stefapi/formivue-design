import { HeatmapChart as schema } from '../schemas/HeatmapChart'
import { chartLocales } from './settings'

export const HeatmapChart = chartLocales('HeatmapChart', schema, {
  xKey: [
    'Grid column',
    'Colonne horizontale de la grille',
    'Columna de la cuadrícula',
  ],
  groupKey: [
    'Grid row',
    'Colonne des lignes de la grille',
    'Fila de la cuadrícula',
  ],
})
