import { defineComponent, h } from 'vue'
import { observer } from '@formivue/reactive-vue'
import { usePrefix, useTreeNode, useSelection } from '../../hooks'
import { IconWidget } from '../IconWidget'
import { TextWidget } from '../TextWidget'
import cls from 'classnames'

export interface INodeActionsWidgetProps {
  className?: string
  style?: any
  activeShown?: boolean
}

export interface INodeActionsWidgetActionProps {
  class?: string
  style?: any
  title?: any
  icon?: any
  href?: string
  onClick?: (e: MouseEvent) => void
  [key: string]: any
}

// antd Space/Divider/Typography.Link → flex maison + <a> (V1 headless).
const NodeActionsWidgetInternal = observer(
  defineComponent({
    name: 'NodeActionsWidget',
    props: {
      className: { type: String, default: undefined },
      style: { type: Object, default: undefined },
      activeShown: { type: Boolean, default: false },
    },
    setup(props, { slots }) {
      const node = useTreeNode()
      const prefix = usePrefix('node-actions')
      const selection = useSelection()
      return () => {
        // selected lu au render (tracker) — sémantique useSelected d'ère
        const selected = selection?.selected || []
        if (selected.indexOf(node?.id) === -1 && props.activeShown) return null
        const children = slots.default?.() || []
        return h(
          'div',
          {
            // structure d'ère (NodeActionsWidget/styles.less) : ligne
            // d'actions centrée + tirets latéraux (::before/::after)
            class: cls(
              prefix,
              'flex w-full items-center justify-center overflow-hidden py-2',
              props.className,
            ),
            style: props.style,
          },
          [
            h(
              'div',
              {
                class: cls(
                  prefix + '-content',
                  'relative flex items-center px-5 leading-none',
                  "before:absolute before:right-full before:top-1/2 before:block before:h-0 before:w-[300%] before:border-b before:border-dashed before:border-border before:content-['']",
                  "after:absolute after:left-full after:top-1/2 after:block after:h-0 after:w-[300%] after:border-b after:border-dashed after:border-border after:content-['']",
                ),
              },
              [
                h(
                  'div',
                  {
                    class:
                      'flex flex-wrap items-center gap-2 text-sm text-foreground',
                  },
                  children.map((child, index) => [
                    index > 0 &&
                      h('span', {
                        class: 'h-4 w-px bg-border',
                        'aria-hidden': 'true',
                      }),
                    child,
                  ]),
                ),
              ],
            ),
          ],
        )
      }
    },
  }),
)

// interne — exposé comme static NodeActionsWidget.Action (contrat d'ère)
const NodeAction = defineComponent({
  name: 'NodeActionsWidget.Action',
  inheritAttrs: false,
  props: {
    title: { type: [String, Object], default: undefined },
    icon: { type: [String, Object, Function], default: undefined },
  },
  setup(props, { attrs }) {
    const prefix = usePrefix('node-actions-item')
    return () =>
      h(
        'a',
        {
          ...attrs,
          class: cls(attrs.class as string, prefix),
          'data-click-stop-propagation': 'true',
        },
        [
          h(
            'span',
            { class: prefix + '-text inline-flex items-center gap-1' },
            [
              h(IconWidget, { infer: props.icon }),
              h(TextWidget, { token: props.title as any }),
            ],
          ),
        ],
      )
  },
})

NodeActionsWidgetInternal.Action = NodeAction

export const NodeActionsWidget =
  NodeActionsWidgetInternal as typeof NodeActionsWidgetInternal & {
    Action: typeof NodeAction
  }
