import {
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
  type PropType,
} from 'vue'
import {
  TreeNode,
  ClosestPosition,
  CursorStatus,
  DragMoveEvent,
} from '@formivue-design/core'
import { isFn } from '@formivue-design/shared'
import { autorun } from '@formivue/reactive'
import { observer } from '@formivue/reactive-vue'
import {
  useCursor,
  useSelection,
  useMoveHelper,
  useDesigner,
  usePrefix,
} from '../../hooks'
import { IconWidget } from '../IconWidget'
import { NodeTitleWidget } from '../NodeTitleWidget'
import { NodeContext } from './context'
import cls from 'classnames'

export interface IOutlineTreeNodeProps {
  node: TreeNode
  style?: any
  className?: string
  workspaceId?: string
}

export const OutlineTreeNode = observer(
  defineComponent({
    name: 'OutlineTreeNode',
    props: {
      node: { type: Object as PropType<TreeNode>, required: true },
      style: { type: Object, default: undefined },
      className: { type: String, default: undefined },
      workspaceId: { type: String, default: undefined },
    },
    setup(props) {
      const prefix = usePrefix('outline-tree-node')
      const engine = useDesigner()
      const nodeRef = ref<HTMLDivElement>(null)
      const ctx = inject(NodeContext, null)
      const request = { current: null as any }
      const cursor = useCursor()
      const selection = useSelection(props.workspaceId)
      const moveHelper = useMoveHelper(props.workspaceId)

      onMounted(() => {
        const unSubscribe = engine?.subscribeTo(DragMoveEvent, () => {
          const closestNodeId = moveHelper?.closestNode?.id
          const closestDirection = moveHelper?.outlineClosestDirection
          const id = props.node.id
          if (!nodeRef.value) return
          if (
            closestNodeId === id &&
            closestDirection === ClosestPosition.Inner
          ) {
            if (!nodeRef.value.classList.contains('droppable')) {
              nodeRef.value.classList.add('droppable')
            }
            if (!nodeRef.value.classList.contains('expanded')) {
              if (request.current) {
                clearTimeout(request.current)
                request.current = null
              }
              request.current = setTimeout(() => {
                nodeRef.value?.classList.add('expanded')
              }, 600)
            }
          } else {
            if (request.current) {
              clearTimeout(request.current)
              request.current = null
            }
            if (nodeRef.value.classList.contains('droppable')) {
              nodeRef.value.classList.remove('droppable')
            }
          }
        })
        const disposer = autorun(() => {
          const selectedIds = selection?.selected || []
          const id = props.node.id
          if (!nodeRef.value) return
          if (selectedIds.includes(id)) {
            if (!nodeRef.value.classList.contains('selected')) {
              nodeRef.value.classList.add('selected')
            }
          } else {
            if (nodeRef.value.classList.contains('selected')) {
              nodeRef.value.classList.remove('selected')
            }
          }
          if (
            cursor?.status === CursorStatus.Dragging &&
            moveHelper?.dragNodes?.length
          ) {
            if (nodeRef.value.classList.contains('selected')) {
              nodeRef.value.classList.remove('selected')
            }
          }
        })
        onBeforeUnmount(() => {
          unSubscribe?.()
          disposer()
        })
      })

      const renderIcon = (node: TreeNode) => {
        const icon = (node as any).designerProps?.icon
        if (icon) {
          return h(IconWidget, { infer: icon, size: 12 })
        }
        if (node === node?.root) {
          return h(IconWidget, { infer: 'Page', size: 12 })
        } else if ((node as any).designerProps?.droppable) {
          return h(IconWidget, { infer: 'Container', size: 12 })
        }
        return h(IconWidget, { infer: 'Component', size: 12 })
      }

      const renderTitle = (node: TreeNode) => {
        if (isFn(ctx?.value?.renderTitle)) return ctx.value.renderTitle(node)
        return h('span', [h(NodeTitleWidget, { node })])
      }

      const renderActions = (node: TreeNode) => {
        if (isFn(ctx?.value?.renderActions))
          return ctx.value.renderActions(node)
      }

      return () => {
        const node = props.node
        if (!node) return null
        return h(
          'div',
          {
            style: props.style,
            ref: nodeRef,
            class: cls(
              prefix,
              props.className,
              'expanded',
              'relative w-fit min-w-full select-none',
            ),
            'data-designer-outline-node-id': node.id,
          },
          [
            h(
              'div',
              {
                // structure d'ère (OutlineWidget/styles.less) — l'état
                // sélectionné est porté par la classe .selected toggée par le
                // moteur sur le node (variante arbitraire Tailwind)
                class: cls(
                  prefix + '-header',
                  'relative flex min-h-8 w-fit min-w-full items-center pl-2 text-foreground',
                  '[.selected>&]:bg-muted/50',
                ),
              },
              [
                h('div', {
                  class: cls(
                    prefix + '-header-head',
                    'pointer-events-none absolute inset-y-0 left-0',
                  ),
                  style: {
                    left: -node.depth * 16 + 'px',
                    width: node.depth * 16 + 'px',
                  },
                }),
                h(
                  'div',
                  {
                    class: cls(
                      prefix + '-header-content',
                      'flex h-full w-fit min-w-full origin-left items-center justify-between text-xs transition-all duration-150 ease-in',
                    ),
                  },
                  [
                    h(
                      'div',
                      {
                        class: cls(
                          prefix + '-header-base',
                          'flex items-center',
                        ),
                      },
                      [
                        (node?.children?.length > 0 || node === node.root) &&
                          h(
                            'div',
                            {
                              // replié : -90° ; .expanded (node) → 0° (d'ère)
                              class: cls(
                                prefix + '-expand',
                                'flex w-3 -rotate-90 mr-[3px] items-center transition-all duration-150 ease-out',
                                '[.expanded>&]:rotate-0',
                              ),
                              onClick: (e: MouseEvent) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (
                                  nodeRef.value?.classList?.contains('expanded')
                                ) {
                                  nodeRef.value?.classList.remove('expanded')
                                } else {
                                  nodeRef.value?.classList.add('expanded')
                                }
                              },
                            },
                            [h(IconWidget, { infer: 'Expand', size: 10 })],
                          ),
                        h(
                          'div',
                          {
                            class: cls(
                              prefix + '-icon',
                              'flex items-center mr-[5px] text-xs',
                            ),
                          },
                          [renderIcon(node)],
                        ),
                        h(
                          'div',
                          {
                            class: cls(
                              prefix + '-title',
                              'mr-[100px] overflow-hidden text-ellipsis whitespace-nowrap',
                            ),
                          },
                          [renderTitle(node)],
                        ),
                      ],
                    ),
                    h(
                      'div',
                      {
                        class: cls(
                          prefix + '-header-actions',
                          'flex items-center mr-2 overflow-hidden text-ellipsis whitespace-nowrap',
                        ),
                        'data-click-stop-propagation': 'true',
                      },
                      [
                        renderActions(node),
                        node !== node.root &&
                          h(IconWidget, {
                            // d'ère : l'œil est masqué par défaut, visible si
                            // le node est .hidden (l'état) ou au survol du
                            // header — la classe .hidden est AUSSI l'utilitaire
                            // Tailwind display:none, d'où la surcharge
                            // arbitraire (&.hidden, 2 classes > 1)
                            class: cls(
                              prefix + '-hidden-icon',
                              'hidden',
                              '[&.hidden]:block',
                              '[.dn-outline-tree-node-header:hover_&]:block',
                              {
                                hidden: (node as any).hidden,
                              },
                            ),
                            infer: (node as any).hidden ? 'EyeClose' : 'Eye',
                            size: 14,
                            onClick: () => {
                              ;(node as any).hidden = !(node as any).hidden
                            },
                          } as any),
                      ],
                    ),
                  ],
                ),
              ],
            ),
            h(
              'div',
              {
                // replié : none (d'ère) ; .expanded (node) → block
                class: cls(
                  prefix + '-children',
                  'hidden w-fit min-w-full pl-4 [.expanded>&]:block',
                ),
              },
              node.children?.map((child) => {
                return h(OutlineTreeNode, {
                  node: child,
                  key: child.id,
                  workspaceId: props.workspaceId,
                })
              }),
            ),
          ],
        )
      }
    },
  }),
)
