import { inject, type InjectionKey } from 'vue'

type ArrayMessage = (name: string) => string | undefined

export const ArrayMessageKey: InjectionKey<ArrayMessage> = Symbol(
  'FormivueArrayMessage',
)

export const arrayMessages: Record<string, Record<string, string>> = {
  'en-US': {
    addCard: 'Add card',
    addRow: 'Add row',
    empty: 'No items',
    column: 'Column',
    actions: 'Actions',
    Copy: 'Duplicate',
    Remove: 'Remove',
    MoveUp: 'Move up',
    MoveDown: 'Move down',
    sort: 'Reorder row. Drag or use the up and down arrow keys.',
  },
  'fr-FR': {
    addCard: 'Ajouter une carte',
    addRow: 'Ajouter une ligne',
    empty: 'Aucun élément',
    column: 'Colonne',
    actions: 'Actions',
    Copy: 'Dupliquer',
    Remove: 'Supprimer',
    MoveUp: 'Monter',
    MoveDown: 'Descendre',
    sort: 'Réordonner la ligne. Glisser ou utiliser les flèches haut et bas.',
  },
  'es-ES': {
    addCard: 'Añadir tarjeta',
    addRow: 'Añadir fila',
    empty: 'No hay elementos',
    column: 'Columna',
    actions: 'Acciones',
    Copy: 'Duplicar',
    Remove: 'Eliminar',
    MoveUp: 'Subir',
    MoveDown: 'Bajar',
    sort: 'Reordenar la fila. Arrastra o usa las flechas arriba y abajo.',
  },
}

export function useArrayMessage() {
  const language = globalThis.navigator?.language?.split('-')[0]
  const locale =
    language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US'
  return inject(ArrayMessageKey, (name: string) => arrayMessages[locale][name])
}
