// Phase 7 (7.1) — port Vue de content.tsx (multi-workspace) : la Card d'ère
// s'élargit à son contenu (height auto quand elle a des enfants, 150 sinon).
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
