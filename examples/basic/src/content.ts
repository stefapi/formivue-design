// Phase 7 (7.1) — port Vue de content.tsx : composants custom Field/Card du
// canvas (inline styles d'ère conservés — V6 : pas de tokens antd ici).
// `observer` vient de @formivue/reactive-vue ; `useTreeNode` résolu au setup.
import { defineComponent, h } from 'vue'
import { message } from '../../shared/language'
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
            h(
              'span',
              { 'data-content-editable': 'title' },
              node?.props?.title === 'Input'
                ? message(['Input', 'Champ de saisie', 'Campo de entrada'])
                : node?.props?.title,
            ),
            slots.default?.(),
          ],
        )
    },
  }) as any,
)

const Card = observer(
  defineComponent({
    name: 'ExampleCard',
    inheritAttrs: false,
    setup(_props, { attrs, slots }) {
      return () =>
        h(
          'div',
          {
            ...(attrs as any),
            style: {
              width: '200px',
              height: '100px',
              ...(attrs as any).style,
              background: '#eee',
              border: '1px solid #ddd',
              display: 'flex',
              padding: '10px',
              justifyContent: 'center',
              alignItems: 'center',
            },
          },
          slots.default?.() ?? [h(TextWidget, { token: 'dropHint' })],
        )
    },
  }) as any,
)

export const Content = defineComponent({
  name: 'Content',
  setup() {
    return () =>
      h(ComponentTreeWidget, {
        components: { Field, Card } as any,
      })
  },
})
