// Space headless (vue-ui) : direction/size/wrap.
export const Space = {
  'en-US': {
    title: 'Space',
    settings: {
      'x-component-props': {
        direction: {
          title: 'Direction',
          dataSource: ['Vertical', 'Horizontal'],
        },
        size: {
          title: 'Size',
          dataSource: ['Small', 'Middle', 'Large', 'Inherit'],
        },
        wrap: 'Word Wrap',
      },
    },
  },
  'fr-FR': {
    title: 'Espacement',
    settings: {
      'x-component-props': {
        direction: {
          title: 'Direction',
          dataSource: ['Verticale', 'Horizontale'],
        },
        size: {
          title: 'Taille',
          dataSource: ['Petit', 'Moyen', 'Grand', 'Hérité'],
        },
        wrap: 'Retour à la ligne',
      },
    },
  },
  'es-ES': {
    title: 'Espaciado',
    settings: {
      'x-component-props': {
        direction: {
          title: 'Dirección',
          dataSource: ['Vertical', 'Horizontal'],
        },
        size: {
          title: 'Tamaño',
          dataSource: ['Pequeño', 'Medio', 'Grande', 'Heredado'],
        },
        wrap: 'Ajuste de línea',
      },
    },
  },
}
