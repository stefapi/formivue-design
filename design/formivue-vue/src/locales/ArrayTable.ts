// ArrayTable maison : les props de table antd disparaissent (V1) — restent
// les messages d'actions du LoadTemplate + le locale de colonne.
export const ArrayTable = {
  'en-US': {
    title: 'Array Table',
    addSortHandle: 'Add Sort Handle',
    addColumn: 'Add Column',
    addIndex: 'Add Index',
    addOperation: 'Add Operations',
  },
  'fr-FR': {
    title: 'Tableau répétable',
    addSortHandle: 'Ajouter une poignée de tri',
    addColumn: 'Ajouter une colonne',
    addIndex: 'Ajouter un index',
    addOperation: 'Ajouter des opérations',
  },
  'es-ES': {
    title: 'Tabla de lista',
    addSortHandle: 'Añadir control de ordenación',
    addColumn: 'Añadir columna',
    addIndex: 'Añadir índice',
    addOperation: 'Añadir operaciones',
  },
}

export const ArrayTableColumn = {
  'en-US': {
    title: 'Column',
    settings: {
      'x-component-props': {
        title: 'Title',
        align: {
          title: 'Align',
          dataSource: ['Left', 'Right', 'Center'],
        },
        width: 'Width',
      },
    },
  },
  'fr-FR': {
    title: 'Colonne',
    settings: {
      'x-component-props': {
        title: 'Titre',
        align: {
          title: 'Alignement',
          dataSource: ['Gauche', 'Droite', 'Centre'],
        },
        width: 'Largeur',
      },
    },
  },
  'es-ES': {
    title: 'Columna',
    settings: {
      'x-component-props': {
        title: 'Título',
        align: {
          title: 'Alineación',
          dataSource: ['Izquierda', 'Derecha', 'Centro'],
        },
        width: 'Ancho',
      },
    },
  },
}
