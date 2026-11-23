import type { ISchema } from '@formivue/json-schema'
import { ArrayTable } from './ArrayTable'
import { Card } from './Card'

// ArrayCards = Card (+ titre) ; Addition partagée avec ArrayTable.
export const ArrayCards: ISchema & { Addition?: ISchema } = {
  type: 'object',
  properties: {
    ...(Card.properties as any),
  },
}

ArrayCards.Addition = ArrayTable.Addition
