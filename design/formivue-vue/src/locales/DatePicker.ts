import { createLocales } from '@formivue-design/core'
export const DatePicker = {
  'en-US': {
    title: 'DatePicker',
    settings: {
      'x-component-props': {
        showTime: 'Show Time',
        placeholder: 'Placeholder',
      },
    },
  },
  'fr-FR': {
    title: 'Sélecteur de date',
    settings: {
      'x-component-props': {
        showTime: 'Afficher l’heure',
        placeholder: 'Texte indicatif',
      },
    },
  },
  'es-ES': {
    title: 'Selector de fecha',
    settings: {
      'x-component-props': {
        showTime: 'Mostrar hora',
        placeholder: 'Texto de ejemplo',
      },
    },
  },
}

export const DateRangePicker = createLocales(DatePicker, {
  'en-US': { title: 'DateRange' },
  'fr-FR': { title: 'Plage de dates' },
  'es-ES': { title: 'Rango de fechas' },
})
