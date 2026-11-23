// formivue/vue — Card (port : Card vue-ui avec titre éditable in-canvas,
// slot extra pour les opérations ArrayCards).
import { defineComponent, h } from 'vue'
import { createBehavior, createResource } from '@formivue-design/core'
import type { DnFC } from '@formivue-design/vue'
import { Card as DCard } from '@formivue-design/vue-ui'
import { createVoidFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

export const Card: DnFC<any> = defineComponent({
  name: 'DCardMaterial',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(DCard, attrs, {
        ...slots,
        ...(!slots.title && attrs.title
          ? {
              title: () =>
                h(
                  'span',
                  { 'data-content-editable': 'x-component-props.title' },
                  attrs.title as string,
                ),
            }
          : {}),
      })
  },
}) as any

Card.Behavior = createBehavior({
  name: 'Card',
  extends: ['Field'],
  selector: (node) => node.props['x-component'] === 'Card',
  designerProps: {
    droppable: true,
    propsSchema: createVoidFieldSchema(AllSchemas.Card),
  },
  designerLocales: AllLocales.Card,
})

Card.Resource = createResource({
  icon: 'CardSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        type: 'void',
        'x-component': 'Card',
        'x-component-props': {
          title: 'Title',
        },
      },
    },
  ],
})
