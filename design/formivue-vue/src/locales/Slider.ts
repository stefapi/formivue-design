export const Slider = {
  'en-US': {
    title: 'Slider',
    settings: {
      default: {
        title: 'Initial value',
        tooltip:
          'Value shown when the form opens. Leave blank to start at the minimum.',
      },
      'x-component-props': {
        showValue: 'Show value',
        min: 'Minimum',
        max: { title: 'Maximum', tooltip: 'Must be greater than the minimum.' },
        step: {
          title: 'Step',
          tooltip: 'Amount added or subtracted for each move.',
        },
      },
    },
  },
  'fr-FR': {
    title: 'Curseur',
    settings: {
      default: {
        title: 'Valeur initiale',
        tooltip:
          'Valeur affichée à l’ouverture du formulaire. Laisser vide pour partir du minimum.',
      },
      'x-component-props': {
        showValue: 'Afficher la valeur',
        min: 'Minimum',
        max: { title: 'Maximum', tooltip: 'Doit être supérieur au minimum.' },
        step: {
          title: 'Pas',
          tooltip: 'Écart entre deux positions du curseur.',
        },
      },
    },
  },
  'es-ES': {
    title: 'Deslizador',
    settings: {
      default: {
        title: 'Valor inicial',
        tooltip:
          'Valor mostrado al abrir el formulario. Déjalo vacío para empezar en el mínimo.',
      },
      'x-component-props': {
        showValue: 'Mostrar el valor',
        min: 'Mínimo',
        max: { title: 'Máximo', tooltip: 'Debe ser superior al mínimo.' },
        step: {
          title: 'Paso',
          tooltip: 'Distancia entre dos posiciones del deslizador.',
        },
      },
    },
  },
}
