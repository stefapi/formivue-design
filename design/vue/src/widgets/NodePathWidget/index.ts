import cls from 'classnames'
import { defineComponent, h } from 'vue'
import { GlobalRegistry } from '@formivue-design/core'
import { useTree, useSelection, usePrefix, useHover } from '../../hooks'
import { IconWidget } from '../IconWidget'
import { NodeTitleWidget } from '../NodeTitleWidget'
import { observer } from '@formivue/reactive-vue'

export interface INodePathWidgetProps {
  workspaceId?: string
  maxItems?: number
}

// antd Breadcrumb → nav/ol sémantique maison (V1 : headless, classes
// utilitaires Tailwind — scannées côté consommateur).
// Composables = contrat Vue : résolus dans setup, les lectures dynamiques
// (selected) se font dans le render via les observables stables (tracker).
export const NodePathWidget = observer(
  defineComponent({
    name: 'NodePathWidget',
    props: {
      workspaceId: { type: String, default: undefined },
      maxItems: { type: Number, default: undefined },
    },
    setup(props) {
      const selection = useSelection(props.workspaceId)
      const hover = useHover(props.workspaceId)
      const tree = useTree(props.workspaceId)
      const prefix = usePrefix('node-path')
      return () => {
        const selected = tree?.findById?.(selection?.selected?.[0])
        if (!selected) return null
        const maxItems = props.maxItems ?? 3
        const nodes = selected
          .getParents()
          .slice(0, maxItems - 1)
          .reverse()
          .concat(selected)
        // d'ère (NodePathWidget/styles.less) : bandeau 4px 10px + filet bas,
        // séparateurs « / » du Breadcrumb antd, 12px
        return h(
          'nav',
          {
            class: cls(prefix, 'shrink-0 border-b border-border px-2.5 py-1'),
            'aria-label':
              GlobalRegistry.getDesignerMessage('tools.nodePath') ||
              'Node path',
          },
          [
            h(
              'ol',
              {
                class:
                  'flex flex-wrap items-center text-xs text-muted-foreground',
              },
              [
                nodes.map((node, key) => {
                  const isLast = key === nodes.length - 1
                  return h('li', { key, class: 'flex items-center' }, [
                    key > 0 &&
                      h('span', { class: 'mx-1', 'aria-hidden': 'true' }, '/'),
                    key === 0 &&
                      h(IconWidget, {
                        infer: 'Position',
                        class: 'mr-[3px] text-[11px]',
                      }),
                    h(
                      'a',
                      {
                        href: '',
                        onMouseenter: () => {
                          hover?.setHover(node)
                        },
                        onClick: (e: MouseEvent) => {
                          e.stopPropagation()
                          e.preventDefault()
                          selection?.select(node)
                        },
                        'aria-current': isLast ? 'location' : undefined,
                        class: cls(
                          'cursor-pointer hover:text-primary',
                          isLast && 'text-foreground',
                        ),
                      },
                      [h(NodeTitleWidget, { node })],
                    ),
                  ])
                }),
              ],
            ),
          ],
        )
      }
    },
  }),
)
