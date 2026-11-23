import cls from 'classnames'
import { defineComponent, h, onBeforeUnmount, onMounted, ref } from 'vue'
import { useCursor, usePrefix, useDesigner } from '../../hooks'
import { CursorStatus } from '@formivue-design/core'
import { autorun } from '@formivue/reactive'
import { observer } from '@formivue/reactive-vue'
import { NodeTitleWidget } from '../NodeTitleWidget'

export const GhostWidget = observer(
  defineComponent({
    name: 'GhostWidget',
    setup() {
      const designer = useDesigner()
      const cursor = useCursor()
      const ghostRef = ref<HTMLDivElement>(null)
      const prefix = usePrefix('ghost')

      onMounted(() => {
        const disposer = autorun(() => {
          const transform = `perspective(1px) translate3d(${
            cursor?.position?.topClientX - 18
          }px,${cursor?.position?.topClientY - 12}px,0) scale(0.8)`
          if (!ghostRef.value) return
          ghostRef.value.style.transform = transform
        })
        onBeforeUnmount(() => disposer())
      })

      return () => {
        const movingNodes = designer?.findMovingNodes() || []
        const firstNode = movingNodes[0]
        const renderNodes = () => {
          return h('span', { style: { whiteSpace: 'nowrap' } }, [
            h(NodeTitleWidget, { node: firstNode }),
            movingNodes.length > 1 ? '...' : '',
          ])
        }
        if (!firstNode) return null
        return cursor?.status === CursorStatus.Dragging
          ? h(
              'div',
              {
                ref: ghostRef,
                // structure d'ère (GhostWidget/styles.less) : pastille fixe
                // suivant le curseur (position inline), 30px, arrondie
                class: cls(
                  prefix,
                  'pointer-events-none fixed left-0 top-0 z-[9999] flex h-[30px] items-center justify-center rounded-[50px] bg-primary/50 pr-[15px] pl-[25px] text-xs text-primary-foreground',
                ),
              },
              [renderNodes()],
            )
          : null
      }
    },
  }),
)
