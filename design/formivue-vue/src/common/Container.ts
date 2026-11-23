// formivue/vue — common/Container (port de l'ère : DroppableWidget du chrome,
// consommé par ObjectContainer / withContainer(Space, FormLayout…)).
import { defineComponent, h } from 'vue'
import { observer } from '@formivue/reactive-vue'
import { DroppableWidget, useTreeNode } from '@formivue-design/vue'

export const Container = observer(
  defineComponent({
    name: 'DContainer',
    setup(_, { slots }) {
      return () => h(DroppableWidget, null, slots)
    },
  }),
)

// Le composant participe directement à la mise en page dès qu'il est rempli.
export const withContainer = (Target: any) =>
  observer(
    defineComponent({
      name: `With${Target?.name ?? 'Container'}`,
      inheritAttrs: false,
      setup(_, { attrs, slots }) {
        const node = useTreeNode()
        return () =>
          node && !node.children.length
            ? h(DroppableWidget, {
                className: attrs.class as string,
                style: attrs.style,
              })
            : h(Target, attrs, slots)
      },
    }),
  )
