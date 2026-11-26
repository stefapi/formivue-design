import { defineComponent, h, onBeforeUnmount, onMounted, ref } from 'vue'
import { ITreeNode, WorkbenchTypes } from '@formivue-design/core'
import { observer } from '@formivue/reactive-vue'
import { autorun } from '@formivue/reactive'
import { useTree, useWorkbench } from '../hooks'
import { useIdleAnimationFrame } from '../hooks/useIdleAnimationFrame'
import { Viewport } from '../containers'

export interface IViewPanelProps {
  type: WorkbenchTypes
  scrollable?: boolean
  dragTipsDirection?: 'left' | 'right'
}

// Era : children = render prop (tree, onChange) => ReactElement.
// Vue : slot default recevant { tree, onChange } (écart de forme §1.5).
export const ViewPanel = observer(
  defineComponent({
    name: 'ViewPanel',
    props: {
      type: { type: String as () => WorkbenchTypes, required: true },
      scrollable: { type: Boolean, default: true },
      dragTipsDirection: {
        type: String as () => 'left' | 'right',
        default: undefined,
      },
    },
    setup(props, { slots }) {
      const visible = ref(true)
      const workbench = useWorkbench()
      const tree = useTree()
      const reveal = useIdleAnimationFrame(() => {
        visible.value = true
      })

      onMounted(() => {
        const disposer = autorun(() => {
          if (workbench?.type !== props.type) {
            reveal.cancel()
            visible.value = false
          } else if (props.type !== 'FORMIVUEDESIGN' && !visible.value) {
            reveal.schedule()
          }
        })
        onBeforeUnmount(() => disposer())
      })

      const render = () => {
        return slots.default?.({
          tree,
          onChange: (payload: ITreeNode) => {
            tree.from(payload)
            tree.takeSnapshot()
          },
        })
      }

      return () => {
        if (workbench?.type !== props.type) return null
        if (workbench?.type === 'FORMIVUEDESIGN')
          return h(
            Viewport,
            { dragTipsDirection: props.dragTipsDirection },
            { default: () => render() },
          )
        return h(
          'div',
          {
            style: {
              overflow: props.scrollable ? 'overlay' : 'hidden',
              height: '100%',
              cursor: 'auto',
              userSelect: 'text',
            },
          },
          [visible.value && render()],
        )
      }
    },
  }),
)
