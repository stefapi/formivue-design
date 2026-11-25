// @formivue-design/formivue-vue — la couche matériau du designer Vue (port de
// formivue/antd → pile headless reka-ui/shadcn-vue de @formivue-design/vue-ui,
// bindings @formivue/vue du fork).
//
// Export public = contrat baseline @formivue-design/formivue-antd (33 − 5 backlog)
// + les bindings réelles additives (FormItem, ArrayBase, PreviewText,
// Materials — notes phase 4). Les helpers
// internes (shared, hooks, common) suivent l'ère : importés par les
// matériaux, pas par l'entrée publique.
export * from './components'
export * from './schemas'
export * from './locales'
export {
  ComposedPreviewText,
  PreviewText,
  type IComposedPreviewText,
} from '@formivue-design/formivue-runtime'
export * from './array-base'
export * from './materials'
