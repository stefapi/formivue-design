import { createLocales } from '@formivue-design/core'
import { Card } from './Card'

export const ArrayCards = createLocales(Card, {
  'en-US': {
    title: 'Array Cards',
    addIndex: 'Add Index',
    addOperation: 'Add Operations',
  },
  'fr-FR': {
    title: 'Cartes répétables',
    addIndex: 'Ajouter un index',
    addOperation: 'Ajouter des opérations',
  },
  'es-ES': {
    title: 'Lista de tarjetas',
    addIndex: 'Añadir índice',
    addOperation: 'Añadir operaciones',
  },
})
