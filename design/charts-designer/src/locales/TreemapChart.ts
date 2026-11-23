import { TreemapChart as schema } from '../schemas/TreemapChart'
import { chartLocales } from './settings'

export const TreemapChart = chartLocales('TreemapChart', schema, {
  groupKey: [
    'Parent group column',
    'Colonne du groupe parent',
    'Columna del grupo principal',
  ],
})
