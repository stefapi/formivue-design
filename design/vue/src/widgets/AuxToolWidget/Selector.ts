import cls from 'classnames'
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  type PropType,
} from 'vue'
import { TreeNode } from '@formivue-design/core'
import { useHover, useSelection, usePrefix } from '../../hooks'
import { IconWidget } from '../IconWidget'
import { NodeTitleWidget } from '../NodeTitleWidget'
import { Button } from '@formivue-design/vue-ui'
import { observer } from '@formivue/reactive-vue'

const useMouseHover = (
  refObject: { value: HTMLElement },
  enter?: () => void,
  leave?: () => void,
) => {
  onMounted(() => {
    let timer: any = null
    let unmounted = false
    const onMouseOver = (e: MouseEvent) => {
      const target: HTMLElement = e.target as any
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (unmounted) return
        if (refObject?.value?.contains(target)) {
          enter?.()
        } else {
          leave?.()
        }
      }, 100)
    }
    document.addEventListener('mouseover', onMouseOver)
    onBeforeUnmount(() => {
      unmounted = true
      clearTimeout(timer)
      document.removeEventListener('mouseover', onMouseOver)
    })
  })
}

export interface ISelectorProps {
  node: TreeNode
  style?: any
}

export const Selector = observer(
  defineComponent({
    name: 'Selector',
    props: {
      node: { type: Object as PropType<TreeNode>, required: true },
    },
    setup(props) {
      const hover = useHover()
      const expand = ref(false)
      const nodeRef = ref<HTMLDivElement>(null)
      const selection = useSelection()
      const prefix = usePrefix('aux-selector')

      const renderIcon = (node: TreeNode) => {
        const icon = (node as any).designerProps?.icon
        if (icon) {
          return h(IconWidget, { infer: icon })
        }
        if (node === node.root) {
          return h(IconWidget, { infer: 'Page' })
        } else if ((node as any).designerProps?.droppable) {
          return h(IconWidget, { infer: 'Container' })
        }
        return h(IconWidget, { infer: 'Component' })
      }

      const renderMenu = () => {
        const parents = props.node.getParents()
        return h(
          'div',
          {
            class: cls(
              prefix + '-menu',
              'absolute left-0 top-full z-10 -mt-1 flex flex-col opacity-80',
            ),
          },
          parents.slice(0, 4).map((parent) => {
            return h(
              Button,
              {
                key: parent.id,
                type: 'primary',
                onClick: () => {
                  selection?.select(parent.id)
                },
                onMouseenter: () => {
                  hover?.setHover(parent)
                },
              },
              {
                default: () => [
                  renderIcon(parent),
                  h(
                    'span',
                    { style: { transform: 'scale(0.85)', marginLeft: '2px' } },
                    [h(NodeTitleWidget, { node: parent })],
                  ),
                ],
              },
            )
          }),
        )
      }

      useMouseHover(
        nodeRef,
        () => {
          expand.value = true
        },
        () => {
          expand.value = false
        },
      )

      return () =>
        h('div', { ref: nodeRef, class: prefix }, [
          h(
            Button,
            {
              class: prefix + '-title',
              type: 'primary',
              onMouseenter: () => {
                hover?.setHover(props.node)
              },
            },
            {
              default: () => [
                renderIcon(props.node),
                h('span', [h(NodeTitleWidget, { node: props.node })]),
              ],
            },
          ),
          expand.value && renderMenu(),
        ])
    },
  }),
)
