import cls from 'classnames'
import { defineComponent, h, type PropType } from 'vue'
import { GlobalRegistry, TreeNode } from '@formivue-design/core'
import { observer } from '@formivue/reactive-vue'
import { IconWidget } from '../IconWidget'
import { useDesigner, usePrefix } from '../../hooks'
import { Button } from '@formivue-design/vue-ui'

export interface IDragHandlerProps {
  node: TreeNode
  style?: any
}

export const DragHandler = observer(
  defineComponent({
    name: 'DragHandler',
    props: {
      node: { type: Object as PropType<TreeNode>, required: true },
    },
    setup(props, { attrs }) {
      const designer = useDesigner()
      const prefix = usePrefix('aux-drag-handler')
      return () => {
        if (props.node === props.node.root || !props.node.allowDrag())
          return null
        const handlerProps = {
          [designer?.props?.nodeDragHandlerAttrName ||
          'data-designer-node-drag-handler']: 'true',
        }
        return h(
          Button,
          {
            ...handlerProps,
            ...attrs,
            // d'ère : .dn-aux-drag-handler { cursor: move }
            class: cls(prefix, 'cursor-move'),
            type: 'primary',
            'aria-label':
              GlobalRegistry.getDesignerMessage('tools.dragNode') ||
              'Drag node',
          } as any,
          { default: () => h(IconWidget, { infer: 'Move' }) },
        )
      }
    },
  }),
)
