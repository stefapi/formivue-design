// formivue/vue — FormLayout (port : withContainer(FormLayout vue-ui) —
// provides FormLayoutKey consommé par FormItemBase, parité conceptuelle du
// FormLayoutContext d'ère).
import { defineComponent, h } from 'vue'
import { createBehavior, createResource } from '@formivue-design/core'
import type { DnFC } from '@formivue-design/vue'
import { FormLayout as DFormLayout } from '@formivue-design/vue-ui'
import { withContainer } from '../../common/Container'
import { createVoidFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

// FormLayout imbriqué dans le Form racine (<form>) : rendu en <div>
const NestedFormLayout = defineComponent({
  name: 'DNestedFormLayout',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(DFormLayout, { tag: 'div', ...attrs }, slots)
  },
})

export const FormLayout: DnFC<any> = withContainer(NestedFormLayout) as any

FormLayout.Behavior = createBehavior({
  name: 'FormLayout',
  extends: ['Field'],
  selector: (node) => node.props['x-component'] === 'FormLayout',
  designerProps: {
    droppable: true,
    propsSchema: createVoidFieldSchema(AllSchemas.FormLayout),
  },
  designerLocales: AllLocales.FormLayout,
})

FormLayout.Resource = createResource({
  icon: 'FormLayoutSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        type: 'void',
        'x-component': 'FormLayout',
      },
    },
  ],
})
