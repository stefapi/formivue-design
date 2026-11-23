// Phase 7 (7.1) — port Vue de content.tsx (sandbox) : composants custom du
// canvas rendu DANS l'iframe (inline styles d'ère — pas de tokens requis
// dans l'iframe, V6). Card non-observer comme l'ère.
import { defineComponent, h } from 'vue'
import {
  ComponentTreeWidget,
  TextWidget,
  useTreeNode,
} from '@formivue-design/vue'
import { observer } from '@formivue/reactive-vue'

const Field = observer(
  defineComponent({
    name: 'ExampleField',
    inheritAttrs: false,
    setup(_props, { attrs, slots }) {
      const node = useTreeNode() as any
      return () =>
        h(
          'span',
          {
            ...(attrs as any),
            style: {
              background: '#eee',
              display: 'inline-block',
              ...(attrs as any).style,
              padding: '10px 20px',
              border: '1px solid #ddd',
            },
          },
          [
            h('span', { 'data-content-editable': 'title' }, node?.props?.title),
            slots.default?.(),
          ],
        )
    },
  }) as any,
)

const Card = defineComponent({
  name: 'ExampleCard',
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    return () =>
      h(
        'div',
        {
          ...(attrs as any),
          style: {
            ...(attrs as any).style,
            background: '#eee',
            border: '1px solid #ddd',
            display: 'flex',
            padding: '10px',
            height: slots.default?.() ? 'auto' : 150,
            justifyContent: 'center',
            alignItems: 'center',
          },
        },
        slots.default?.() ?? [h(TextWidget, { token: 'dropHint' })],
      )
  },
})

export const Content = defineComponent({
  name: 'Content',
  setup() {
    return () =>
      h(ComponentTreeWidget, {
        components: { Field, Card } as any,
      })
  },
})
