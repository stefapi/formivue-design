import cls from 'classnames'
import { defineComponent, h, type PropType, type StyleValue } from 'vue'
import { TreeNode } from '@formivue-design/core'
import { observer } from '@formivue/reactive-vue'
import { useTreeNode, useDesigner } from '../../hooks'
import { NodeTitleWidget } from '../NodeTitleWidget'
import {
  NodeActionsWidget,
  INodeActionsWidgetActionProps,
} from '../NodeActionsWidget'

export interface IDroppableWidgetProps {
  node?: TreeNode
  actions?: INodeActionsWidgetActionProps[]
  placeholder?: boolean
  height?: number
  style?: StyleValue
  className?: string
  hasChildren?: boolean
}

export const DroppableWidget = observer(
  defineComponent({
    name: 'DroppableWidget',
    inheritAttrs: false,
    props: {
      node: { type: Object as PropType<TreeNode>, default: undefined },
      actions: {
        type: Array as PropType<INodeActionsWidgetActionProps[]>,
        default: undefined,
      },
      placeholder: { type: Boolean, default: true },
      height: { type: Number, default: undefined },
      style: {
        type: [String, Object, Array] as PropType<StyleValue>,
        default: undefined,
      },
      className: { type: String, default: undefined },
      hasChildren: { type: Boolean, default: undefined },
    },
    setup(props, { attrs, slots }) {
      const designer = useDesigner()
      const currentNode = useTreeNode()
      return () => {
        const nodeId = {
          [designer?.props?.nodeIdAttrName || 'data-designer-node-id']:
            props.node ? props.node.id : currentNode?.id,
        }
        const target = props.node ?? currentNode
        const hasChildren = props.hasChildren ?? target?.children?.length > 0
        return h(
          'div',
          { ...nodeId, ...attrs, class: props.className, style: props.style },
          [
            hasChildren
              ? slots.default?.()
              : props.placeholder
                ? h(
                    'div',
                    {
                      // d'ère : .dn-droppable-placeholder { height: 60px } (style
                      // inline React : height prioritaire seulement si fourni)
                      style: { height: (props.height ?? 60) + 'px' },
                      // structure d'ère (DroppableWidget/styles.less)
                      class: cls(
                        'dn-droppable-placeholder',
                        'flex items-center justify-center border border-dashed border-border bg-muted/40 text-[13px] font-light text-muted-foreground',
                      ),
                    },
                    [h(NodeTitleWidget, { node: target })],
                  )
                : slots.default?.(),
            props.actions?.length
              ? h(NodeActionsWidget, null, {
                  default: () =>
                    props.actions.map((action, key) =>
                      h(NodeActionsWidget.Action, { ...action, key } as any),
                    ),
                })
              : null,
          ],
        )
      }
    },
  }),
)
