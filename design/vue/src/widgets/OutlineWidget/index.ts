import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  type PropType,
} from 'vue'
import { autorun } from '@formivue/reactive'
import { observer } from '@formivue/reactive-vue'
import { useWorkbench, usePrefix } from '../../hooks'
import { OutlineTreeNode } from './OutlineNode'
import { Insertion } from './Insertion'
import { TreeNode, Viewport } from '@formivue-design/core'
import { NodeContext } from './context'
import cls from 'classnames'
import { globalThisPolyfill } from '@formivue-design/shared'

export interface IOutlineTreeWidgetProps {
  className?: string
  style?: any
  onClose?: () => void
  renderTitle?: (node: TreeNode) => any
  renderActions?: (node: TreeNode) => any
}

// Le workspace courant est lu DANS le render (observable formivue → tracker
// de l'observer) : les résolutions tree/outline suivent les changements de
// workspace comme l'ère les résolvait à chaque render.
export const OutlineTreeWidget = observer(
  defineComponent({
    name: 'OutlineTreeWidget',
    props: {
      className: { type: String, default: undefined },
      style: { type: Object, default: undefined },
      onClose: {
        type: Function as PropType<() => void>,
        default: undefined,
      },
      renderTitle: {
        type: Function as PropType<(node: TreeNode) => any>,
        default: undefined,
      },
      renderActions: {
        type: Function as PropType<(node: TreeNode) => any>,
        default: undefined,
      },
    },
    setup(props, { attrs }) {
      const prefix = usePrefix('outline-tree')
      const workbench = useWorkbench()
      const contentRef = ref<HTMLDivElement>(null)
      const outlineRef = ref<Viewport>(null)

      provide(
        NodeContext,
        computed(() => ({
          renderActions: props.renderActions,
          renderTitle: props.renderTitle,
        })),
      )

      onMounted(() => {
        const disposer = autorun(() => {
          const current =
            workbench?.activeWorkspace || workbench?.currentWorkspace
          const workspaceId = current?.id
          const outline = current?.outline
          if (!workspaceId) return
          if (outlineRef.value && outlineRef.value !== outline) {
            outlineRef.value.onUnmount()
          }
          if (contentRef.value && outline) {
            outline.onMount(contentRef.value, globalThisPolyfill)
          }
          outlineRef.value = outline
        })
        onBeforeUnmount(() => {
          disposer()
          outlineRef.value?.onUnmount()
        })
      })

      return () => {
        const current =
          workbench?.activeWorkspace || workbench?.currentWorkspace
        const workspaceId = current?.id
        const tree = current?.operation?.tree
        const outline = current?.outline
        if (!outline || !workspaceId) return null
        return h(
          'div',
          {
            ...attrs,
            // structure d'ère (OutlineWidget/styles.less) : conteneur
            // colonne flex plein panneau
            class: cls(
              prefix + '-container',
              'relative flex min-h-[100px] h-full w-full flex-col overflow-hidden bg-card',
              props.className,
            ),
            style: props.style,
            'data-designer-outline-workspace-id': workspaceId,
          },
          [
            h(
              'div',
              {
                class: cls(
                  prefix + '-content',
                  'relative h-full w-full grow overflow-y-auto pb-5',
                ),
                ref: contentRef,
              },
              [
                h(OutlineTreeNode, { node: tree, workspaceId }),
                h(
                  'div',
                  {
                    class: cls(prefix + '-aux', 'absolute left-0 top-0'),
                    style: { pointerEvents: 'none' },
                  },
                  [h(Insertion, { workspaceId })],
                ),
              ],
            ),
          ],
        )
      }
    },
  }),
)
