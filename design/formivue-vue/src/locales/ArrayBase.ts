import { GlobalRegistry } from '@formivue-design/core'
import { arrayMessages } from '@formivue-design/formivue-runtime/bindings'

// Port d'ère (effet de bord : messages Previews.* consommés par getMessage).
GlobalRegistry.registerDesignerLocales({
  'en-US': {
    ArrayBase: arrayMessages['en-US'],
    Previews: {
      droppable: 'Drop component here',
      addTabPane: 'Add Tab Pane',
      addCollapsePanel: 'Add Collapse Panel',
      addTableColumn: 'Add Table Column',
      addTableSortHandle: 'Add Sort Handle',
      addIndex: 'Add Index',
      addOperation: 'Add Operation',
    },
  },
  'fr-FR': {
    ArrayBase: arrayMessages['fr-FR'],
    Previews: {
      droppable: 'Déposez un composant ici',
      addTabPane: 'Ajouter un onglet',
      addCollapsePanel: 'Ajouter un panneau',
      addTableColumn: 'Ajouter une colonne',
      addTableSortHandle: 'Ajouter une poignée de tri',
      addIndex: 'Ajouter un index',
      addOperation: 'Ajouter une opération',
    },
  },
  'es-ES': {
    ArrayBase: arrayMessages['es-ES'],
    Previews: {
      droppable: 'Suelte un componente aquí',
      addTabPane: 'Añadir pestaña',
      addCollapsePanel: 'Añadir panel',
      addTableColumn: 'Añadir columna',
      addTableSortHandle: 'Añadir control de ordenación',
      addIndex: 'Añadir índice',
      addOperation: 'Añadir operación',
    },
  },
})

export const ArrayAddition = {
  'en-US': {
    title: 'Add Button',
    settings: {
      'x-component-props': {
        title: 'Button label',
        method: {
          title: 'Insert',
          dataSource: ['At the end', 'At the beginning'],
        },
        defaultValue: 'Default Value',
      },
    },
  },
  'fr-FR': {
    title: 'Bouton d’ajout',
    settings: {
      'x-component-props': {
        title: 'Libellé du bouton',
        method: { title: 'Insérer', dataSource: ['À la fin', 'Au début'] },
        defaultValue: 'Valeur par défaut',
      },
    },
  },
  'es-ES': {
    title: 'Botón de añadir',
    settings: {
      'x-component-props': {
        title: 'Texto del botón',
        method: { title: 'Insertar', dataSource: ['Al final', 'Al principio'] },
        defaultValue: 'Valor predeterminado',
      },
    },
  },
}

export const ArrayRemove = {
  'en-US': {
    title: 'Remove',
  },
  'fr-FR': {
    title: 'Supprimer',
  },
  'es-ES': {
    title: 'Eliminar',
  },
}

export const ArrayCopy = {
  'en-US': { title: 'Duplicate' },
  'fr-FR': { title: 'Dupliquer' },
  'es-ES': { title: 'Duplicar' },
}

export const ArrayMoveUp = {
  'en-US': {
    title: 'Move Up',
  },
  'fr-FR': {
    title: 'Monter',
  },
  'es-ES': {
    title: 'Subir',
  },
}

export const ArrayMoveDown = {
  'en-US': {
    title: 'Move Down',
  },
  'fr-FR': {
    title: 'Descendre',
  },
  'es-ES': {
    title: 'Bajar',
  },
}

export const ArrayIndex = {
  'en-US': {
    title: 'Index',
  },
  'fr-FR': {
    title: 'Index',
  },
  'es-ES': {
    title: 'Índice',
  },
}

export const ArraySortHandle = {
  'en-US': {
    title: 'Sort Handle',
  },
  'fr-FR': {
    title: 'Poignée de tri',
  },
  'es-ES': {
    title: 'Control de ordenación',
  },
}
