import { defineComponent, h, type Component } from 'vue'
import { message, type Message } from '../../shared/language'

const navigation = {
  previousText: ['Previous', 'Précédent', 'Anterior'],
  nextText: ['Next', 'Suivant', 'Siguiente'],
} satisfies Record<string, Message>
const flow = {
  ...navigation,
  finishText: ['Finish', 'Terminer', 'Finalizar'],
  completedText: ['Completed', 'Terminé', 'Completado'],
  validationText: [
    'Check the highlighted fields before continuing.',
    'Vérifiez les champs signalés avant de continuer.',
    'Revisa los campos señalados antes de continuar.',
  ],
} satisfies Record<string, Message>
const defaults: Record<string, Record<string, Message>> = {
  Combobox: {
    placeholder: [
      'Search options…',
      'Rechercher une option…',
      'Buscar opciones…',
    ],
    emptyText: [
      'No matching options',
      'Aucune option correspondante',
      'No hay opciones coincidentes',
    ],
  },
  TagsInput: {
    placeholder: [
      'Add a tag…',
      'Ajouter une étiquette…',
      'Añadir una etiqueta…',
    ],
  },
  HoverCard: {
    triggerText: ['More information', 'Plus d’informations', 'Más información'],
  },
  DataTable: {
    ...navigation,
    label: ['Data table', 'Tableau de données', 'Tabla de datos'],
    searchLabel: [
      'Search table',
      'Rechercher dans le tableau',
      'Buscar en la tabla',
    ],
    emptyText: ['No results', 'Aucun résultat', 'Sin resultados'],
  },
  Carousel: {
    label: ['Carousel', 'Carrousel', 'Carrusel'],
    previousText: [
      'Previous slide',
      'Diapositive précédente',
      'Diapositiva anterior',
    ],
    nextText: ['Next slide', 'Diapositive suivante', 'Diapositiva siguiente'],
  },
  Resizable: {
    handleLabel: [
      'Resize panels',
      'Redimensionner les panneaux',
      'Redimensionar paneles',
    ],
  },
  ScrollArea: {
    label: ['Scrollable content', 'Contenu défilant', 'Contenido desplazable'],
  },
  Drawer: {
    closeText: ['Close', 'Fermer', 'Cerrar'],
    triggerText: ['Open', 'Ouvrir', 'Abrir'],
  },
  Sheet: {
    closeText: ['Close', 'Fermer', 'Cerrar'],
    triggerText: ['Open', 'Ouvrir', 'Abrir'],
  },
  Questionnaire: {
    ...flow,
    label: ['Questionnaire', 'Questionnaire', 'Cuestionario'],
  },
  Stepper: {
    ...flow,
    label: ['Stepper', 'Parcours par étapes', 'Navegación por pasos'],
  },
}

export function localizedMaterials<T extends Record<string, Component>>(
  materials: T,
): T {
  return Object.fromEntries(
    Object.entries(materials).map(([name, component]) => {
      const labels = defaults[name]
      if (!labels) return [name, component]
      return [
        name,
        defineComponent({
          inheritAttrs: false,
          setup(_, { attrs, slots }) {
            return () =>
              h(
                component,
                {
                  ...Object.fromEntries(
                    Object.entries(labels).map(([key, text]) => [
                      key,
                      message(text),
                    ]),
                  ),
                  ...attrs,
                },
                slots,
              )
          },
        }),
      ]
    }),
  ) as T
}
