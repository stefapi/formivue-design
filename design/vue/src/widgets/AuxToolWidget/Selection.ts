import cls from 'classnames'
import { defineComponent, Fragment, h, type PropType } from 'vue'
import {
  useSelection,
  useValidNodeOffsetRect,
  useTree,
  useCursor,
  useMoveHelper,
  useDesigner,
  usePrefix,
} from '../../hooks'
import { observer } from '@formivue/reactive-vue'
import { TreeNode } from '@formivue-design/core'
import { Helpers } from './Helpers'
import { ResizeHandler } from './ResizeHandler'
import { TranslateHandler } from './TranslateHandler'

export interface ISelectionBoxProps {
  node: TreeNode
  showHelpers: boolean
}

export const SelectionBox = defineComponent({
  name: 'SelectionBox',
  props: {
    node: { type: Object as PropType<TreeNode>, required: true },
    showHelpers: { type: Boolean, default: false },
  },
  setup(props) {
    const designer = useDesigner()
    const prefix = usePrefix('aux-selection-box')
    const innerPrefix = usePrefix('aux-selection-box-inner')
    const rectRef = useValidNodeOffsetRect(props.node)
    const createSelectionStyle = () => {
      const nodeRect = rectRef.value
      const baseStyle: any = {
        position: 'absolute',
        top: 0,
        left: 0,
        boxSizing: 'border-box',
        zIndex: 4,
      }
      if (nodeRect) {
        baseStyle.transform = `perspective(1px) translate3d(${nodeRect.x}px,${nodeRect.y}px,0)`
        baseStyle.height = nodeRect.height + 'px'
        baseStyle.width = nodeRect.width + 'px'
      }
      return baseStyle
    }
    return () => {
      const nodeRect = rectRef.value
      if (!nodeRect) return null
      if (!nodeRect.width || !nodeRect.height) return null
      const selectionId = {
        [designer?.props?.nodeSelectionIdAttrName || 'data-designer-node-id']:
          props.node.id,
      }
      return h(
        'div',
        {
          ...selectionId,
          // structure d'ère : bordure 2px, pointer-events none (les enfants
          // handlers réactivent les événements)
          class: cls(
            prefix,
            'relative border-2 border-primary pointer-events-none',
          ),
          style: createSelectionStyle(),
        },
        [
          h('div', {
            class: cls(innerPrefix, 'absolute inset-0'),
          }),
          h(ResizeHandler, { node: props.node }),
          h(TranslateHandler, { node: props.node }),
          props.showHelpers &&
            h(Helpers, { node: props.node, nodeRect } as any),
        ],
      )
    }
  },
})

export const Selection = observer(
  defineComponent({
    name: 'Selection',
    setup() {
      const selection = useSelection()
      const tree = useTree()
      const cursor = useCursor()
      const viewportMoveHelper = useMoveHelper()
      return () => {
        if (cursor?.status !== 'NORMAL' && viewportMoveHelper?.touchNode)
          return null
        return h(
          Fragment,
          (selection?.selected || []).map((id) => {
            const node = tree?.findById(id)
            if (!node) return
            if (node.hidden) return
            return h(SelectionBox, {
              key: id,
              node,
              showHelpers: selection.selected.length === 1,
            })
          }),
        )
      }
    },
  }),
)
