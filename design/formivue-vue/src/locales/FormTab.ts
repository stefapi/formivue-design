// FormTab vue-ui : tabs/activeKey gérés par le composant — le TabPane garde
// son titre (tab).
export const FormTab = {
  'en-US': {
    title: 'Tabs',
    addTabPane: 'Add Panel',
    settings: {
      'x-component-props': {
        activeKey: {
          title: 'Default tab',
          placeholder: 'First available tab',
        },
      },
    },
  },
  'fr-FR': {
    title: 'Onglets',
    addTabPane: 'Ajouter un onglet',
    settings: {
      'x-component-props': {
        activeKey: {
          title: 'Onglet actif par défaut',
          placeholder: 'Premier onglet disponible',
        },
      },
    },
  },
  'es-ES': {
    title: 'Pestañas',
    addTabPane: 'Añadir pestaña',
    settings: {
      'x-component-props': {
        activeKey: {
          title: 'Pestaña activa por defecto',
          placeholder: 'Primera pestaña disponible',
        },
      },
    },
  },
}

export const FormTabPane = {
  'en-US': {
    title: 'Tab Panel',
    settings: {
      'x-component-props': {
        tab: 'Panel Title',
      },
    },
  },
  'fr-FR': {
    title: 'Onglet',
    settings: {
      'x-component-props': {
        tab: "Titre de l'onglet",
      },
    },
  },
  'es-ES': {
    title: 'Panel de pestaña',
    settings: {
      'x-component-props': {
        tab: 'Título de la pestaña',
      },
    },
  },
}
