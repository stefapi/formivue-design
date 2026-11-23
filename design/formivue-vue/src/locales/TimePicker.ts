import { createLocales } from '@formivue-design/core'
export const TimePicker = {
  'en-US': {
    title: 'Time Picker',
    settings: {
      'x-component-props': {
        placeholder: 'Placeholder',
      },
    },
  },
  'fr-FR': {
    title: 'Sélecteur d’heure',
    settings: {
      'x-component-props': {
        placeholder: 'Texte indicatif',
      },
    },
  },
  'es-ES': {
    title: 'Selector de hora',
    settings: {
      'x-component-props': {
        placeholder: 'Texto de ejemplo',
      },
    },
  },
}

export const TimeRangePicker = createLocales(TimePicker, {
  'en-US': { title: 'Time Range' },
  'fr-FR': { title: 'Plage horaire' },
  'es-ES': { title: 'Rango horario' },
})
