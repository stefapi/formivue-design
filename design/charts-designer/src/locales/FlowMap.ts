import { FlowMap as schema } from '../schemas/FlowMap'
import { chartLocales } from './settings'

export const FlowMap = chartLocales('FlowMap', schema, {
  xKey: [
    'Flow label column',
    'Colonne du libellé des flux',
    'Columna de etiquetas de los flujos',
  ],
  latitudeKey: ['Origin latitude', 'Latitude du départ', 'Latitud de origen'],
  longitudeKey: [
    'Origin longitude',
    'Longitude du départ',
    'Longitud de origen',
  ],
})
