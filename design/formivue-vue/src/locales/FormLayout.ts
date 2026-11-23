// FormLayout headless (vue-ui) : layout/labelAlign/labelWidth/size.
export const FormLayout = {
  'en-US': {
    title: 'Form Layout',
    settings: {
      'x-component-props': {
        layout: {
          title: 'Layout',
          dataSource: ['Vertical', 'Horizontal', 'Inherit'],
        },
        labelAlign: {
          title: 'Label Align',
          dataSource: ['Left', 'Right', 'Inherit'],
        },
        labelWidth: 'Label Width',
        size: {
          title: 'Size',
          dataSource: ['Large', 'Middle', 'Small', 'Inherit'],
        },
      },
    },
  },
  'fr-FR': {
    title: 'Mise en page du formulaire',
    settings: {
      'x-component-props': {
        layout: {
          title: 'Disposition',
          dataSource: ['Verticale', 'Horizontale', 'Hérité'],
        },
        labelAlign: {
          title: 'Alignement des étiquettes',
          dataSource: ['Gauche', 'Droite', 'Hérité'],
        },
        labelWidth: 'Largeur des étiquettes',
        size: {
          title: 'Taille',
          dataSource: ['Grand', 'Moyen', 'Petit', 'Hérité'],
        },
      },
    },
  },
  'es-ES': {
    title: 'Diseño del formulario',
    settings: {
      'x-component-props': {
        layout: {
          title: 'Diseño',
          dataSource: ['Vertical', 'Horizontal', 'Heredado'],
        },
        labelAlign: {
          title: 'Alineación de etiquetas',
          dataSource: ['Izquierda', 'Derecha', 'Heredado'],
        },
        labelWidth: 'Anchura de etiquetas',
        size: {
          title: 'Tamaño',
          dataSource: ['Grande', 'Medio', 'Pequeño', 'Heredado'],
        },
      },
    },
  },
}
