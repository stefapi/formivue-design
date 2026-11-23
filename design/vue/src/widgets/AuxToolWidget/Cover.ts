import { defineComponent, Fragment, h, type PropType } from 'vue'
import {
  useViewport,
  useMoveHelper,
  useCursor,
  useValidNodeOffsetRect,
  usePrefix,
} from '../../hooks'
import { observer } from '@formivue/reactive-vue'
import { CursorStatus, ClosestPosition, TreeNode } from '@formivue-design/core'
import cls from 'classnames'

const CoverRect = defineComponent({
  name: 'CoverRect',
  props: {
    node: { type: Object as PropType<TreeNode>, required: true },
    dragging: { type: Boolean, default: false },
    dropping: { type: Boolean, default: false },
  },
  setup(props) {
    const prefix = usePrefix('aux-cover-rect')
    const rectRef = useValidNodeOffsetRect(props.node)
    const createCoverStyle = () => {
      const rect = rectRef.value
      const baseStyle: any = {
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }
      if (rect) {
        baseStyle.transform = `perspective(1px) translate3d(${rect.x}px,${rect.y}px,0)`
        baseStyle.height = rect.height + 'px'
        baseStyle.width = rect.width + 'px'
      }
      return baseStyle
    }
    return () =>
      h('div', {
        // structure d'ère : voile dragging/dropping (tokens V6 — brand
        // d'ère #1890ff → --primary)
        class: cls(
          prefix,
          props.dragging && 'bg-primary/25',
          props.dropping && 'bg-primary/35',
          {
            dragging: props.dragging,
            dropping: props.dropping,
          },
        ),
        style: createCoverStyle(),
      })
  },
})

export const Cover = observer(
  defineComponent({
    name: 'Cover',
    setup() {
      const viewportMoveHelper = useMoveHelper()
      const viewport = useViewport()
      const cursor = useCursor()
      const renderDropCover = () => {
        if (
          !viewportMoveHelper?.closestNode ||
          !viewportMoveHelper?.closestNode?.allowAppend(
            viewportMoveHelper.dragNodes,
          ) ||
          viewportMoveHelper?.viewportClosestDirection !== ClosestPosition.Inner
        )
          return null
        return h(CoverRect, {
          node: viewportMoveHelper.closestNode,
          dropping: true,
        })
      }
      return () => {
        if (cursor?.status !== CursorStatus.Dragging) return null
        return h(Fragment, [
          ...(viewportMoveHelper?.dragNodes || []).map((node) => {
            if (!node) return
            if (!viewport?.findElementById(node.id)) return
            return h(CoverRect, { key: node.id, node, dragging: true })
          }),
          renderDropCover(),
        ])
      }
    },
  }),
)
