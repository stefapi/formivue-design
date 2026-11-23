// formivue/vue — common/LoadTemplate (port de l'ère : NodeActionsWidget du
// chrome, actions d'ajout de blocs — addGridColumn, addTabPane…).
import { defineComponent, h, type PropType } from 'vue'
import { NodeActionsWidget } from '@formivue-design/vue'
import type { INodeActionsWidgetActionProps } from '@formivue-design/vue'

export interface ITemplateAction extends INodeActionsWidgetActionProps {
  onClick?: (e: MouseEvent) => void
}

export interface ILoadTemplateProps {
  className?: string
  style?: Record<string, any>
  actions?: ITemplateAction[]
}

export const LoadTemplate = defineComponent({
  name: 'DLoadTemplate',
  inheritAttrs: false,
  props: {
    className: { type: String, default: undefined },
    style: { type: Object, default: undefined },
    overlay: { type: Boolean, default: false },
    actions: {
      type: Array as PropType<ITemplateAction[]>,
      default: () => [],
    },
  },
  setup(props) {
    return () =>
      h(
        NodeActionsWidget,
        {
          className: props.className,
          activeShown: props.overlay,
          style: props.overlay
            ? {
                position: 'absolute',
                top: '100%',
                insetInline: 0,
                zIndex: 1,
                ...props.style,
              }
            : props.style,
        },
        {
          default: () =>
            (props.actions ?? []).map((action, key) =>
              h(NodeActionsWidget.Action, { ...action, key } as any),
            ),
        },
      )
  },
})
