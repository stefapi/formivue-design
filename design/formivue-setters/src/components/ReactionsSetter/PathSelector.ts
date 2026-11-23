// formivue/setters — ReactionsSetter PathSelector (port de l'ère) : sélecteur
// de chemin d'un champ du formulaire designer (variables de réaction).
// TreeSelect antd → **Popover + Tree maison** (V3 : les éditeurs en arbre
// passent sur les pièces maison ; aucun TreeSelect headless n'existe).
// transformDataSource est le port verbatim d'ère (logique TreeNode pure).
// Résolution d'ère au render (useSelectedNode) → le composable se lit au
// rendu de l'observer (leçons phase 3 : lectures dynamiques au render).
import { defineComponent, h, ref, type PropType } from 'vue'
import { observer } from '@formivue/reactive-vue'
import { TreeNode } from '@formivue-design/core'
import { useSelection, useTree } from '@formivue-design/vue'
import { Button, Popover, Tree, type ITreeItem } from '@formivue-design/vue-ui'

export interface IPathSelectorProps {
  value?: string
  onChange?: (value: string, node: TreeNode) => void
  className?: string
  placeholder?: string
}

interface IPathNodeItem {
  label: string
  value: string
  node: TreeNode
  children: IPathNodeItem[]
}

export const transformDataSource = (node: TreeNode): IPathNodeItem[] => {
  if (!node) return []
  const currentNode = node
  const dots = (count: number) => {
    let dots = ''
    for (let i = 0; i < count; i++) {
      dots += '.'
    }
    return dots
  }
  const targetPath = (parentNode: TreeNode, targetNode: TreeNode) => {
    const path: string[] = []
    const transform = (node: TreeNode) => {
      if (node && node !== parentNode) {
        path.push(node.props.name || node.id)
      } else {
        transform(node.parent)
      }
    }
    transform(targetNode)
    return path.reverse().join('.')
  }
  const hasNoVoidChildren = (node: TreeNode): boolean => {
    return node.children?.some((node) => {
      if (node.props.type !== 'void' && node !== currentNode) return true
      return hasNoVoidChildren(node)
    })
  }
  const findRoot = (node: TreeNode): TreeNode => {
    if (!node?.parent) return node
    if (node?.parent?.componentName !== node.componentName) return node.parent
    return findRoot(node.parent)
  }
  const findArrayParent = (node: TreeNode): TreeNode | undefined => {
    if (!node?.parent) return
    if (node.parent.props.type === 'array') return node.parent
    if (node.parent === root) return
    return findArrayParent(node.parent)
  }
  const transformRelativePath = (arrayNode: TreeNode, targetNode: TreeNode) => {
    if (targetNode.depth === currentNode.depth)
      return `.${targetNode.props.name || targetNode.id}`
    return `${dots(currentNode.depth - arrayNode.depth)}[].${targetPath(
      arrayNode,
      targetNode,
    )}`
  }
  const transformChildren = (
    children: TreeNode[],
    path: string[] = [],
  ): IPathNodeItem[] => {
    return children.reduce<IPathNodeItem[]>((buf, node) => {
      if (node === currentNode) return buf
      if (node.props.type === 'array' && !node.contains(currentNode)) return buf
      if (node.props.type === 'void' && !hasNoVoidChildren(node)) return buf
      const currentPath = path.concat(node.props.name || node.id)
      const arrayNode = findArrayParent(node)
      const label =
        node.props.title ||
        (node.props['x-component-props'] as any)?.title ||
        node.props.name ||
        node.designerProps.title
      const value = arrayNode
        ? transformRelativePath(arrayNode, node)
        : currentPath.join('.')
      return buf.concat({
        label: String(label ?? node.id),
        value,
        node,
        children: transformChildren(node.children, currentPath),
      })
    }, [])
  }
  const root = findRoot(node)
  if (root) {
    return transformChildren(root.children)
  }
  return []
}

export const PathSelector = observer(
  defineComponent({
    name: 'DReactionsPathSelector',
    inheritAttrs: false,
    props: {
      value: { type: String, default: undefined },
      onChange: {
        type: null as unknown as PropType<
          (value: string, node: TreeNode) => void
        >,
        default: undefined,
      },
      className: { type: String, default: undefined },
      placeholder: { type: String, default: undefined },
    },
    setup(props, { attrs }) {
      const tree = useTree()
      const selection = useSelection()
      const open = ref(false)
      // chemins dérivés AU RENDU (sémantique React d'ère : recalcul par render
      // — Vue computed ne suit pas les observables formivue du moteur ; lecture
      // au rendu trackée par l'observer)
      const renderItems = (): IPathNodeItem[] => {
        const baseNode = tree?.findById?.(selection?.selected?.[0] || '')
        return transformDataSource(baseNode)
      }
      // IPathNodeItem → ITreeItem (key = chemin)
      const toTreeItems = (nodes: IPathNodeItem[]): ITreeItem[] =>
        (nodes || []).map((node) => ({
          key: node.value,
          label: node.label,
          children: toTreeItems(node.children ?? []),
        }))
      const findNode = (
        dataSource: IPathNodeItem[],
        value: string,
      ): TreeNode | undefined => {
        for (let i = 0; i < dataSource.length; i++) {
          const item = dataSource[i]
          if (item.value === value) return item.node
          if (item.children?.length) {
            const foundChild = findNode(item.children, value)
            if (foundChild) return foundChild
          }
        }
      }
      return () =>
        h(
          Popover,
          {
            open: open.value,
            'onUpdate:open': (v: boolean) => (open.value = v),
          },
          {
            default: () =>
              h(
                Button,
                {
                  block: true,
                  class: [
                    'justify-start',
                    'font-mono',
                    'text-xs',
                    props.className,
                  ]
                    .filter(Boolean)
                    .join(' '),
                  'aria-label': props.placeholder || 'Select a field path',
                  ...(attrs as any),
                },
                {
                  default: () => props.value || props.placeholder || '',
                },
              ),
            content: () =>
              h(
                'div',
                {
                  class: 'max-h-[280px] w-[280px] overflow-auto p-1',
                },
                [
                  h(Tree, {
                    items: toTreeItems(renderItems()),
                    selectedKey: props.value,
                    onSelect: (key: string) => {
                      const node = findNode(renderItems(), key)
                      props.onChange?.(key, node as TreeNode)
                      open.value = false
                    },
                  }),
                ],
              ),
          },
        )
    },
  }) as any,
)
