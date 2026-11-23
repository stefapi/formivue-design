// formivue/setters — DataSourceSetter TreePanel (port de l'ère) : l'arbre des
// options. antd Tree (draggable) → **Tree maison vue-ui** (reka-ui, rôles
// tree/treeitem) ; le label des nœuds porte le composant Title (libellé +
// actions) — additif vue-ui : ITreeItem.label accepte un VNode (cf. suivi).
// defaultExpandAll d'ère → defaultExpandedKeys = toutes les clés à l'ouverture
// (le contenu du dialog ne monte qu'ouvert) ; sélection → treeDataSource.
import { defineComponent, h, ref, type PropType } from 'vue'
import { uid } from '@formivue/shared'
import { observer } from '@formivue/reactive-vue'
import { GlobalRegistry } from '@formivue-design/core'
import { IconWidget, TextWidget } from '@formivue-design/vue'
import { Button, Tree, type ITreeItem } from '@formivue-design/vue-ui'
import { Header } from './Header'
import { Title } from './Title'
import { findTreeNode, traverseTree } from './shared'
import type { INodeItem, ITreeDataSource } from './types'

export interface ITreePanelProps {
  treeDataSource: ITreeDataSource
  allowTree: boolean
  defaultOptionValue?: {
    label: string
    value: any
  }[]
}

export const TreePanel = observer(
  defineComponent({
    name: 'DDataSourceSetterTreePanel',
    inheritAttrs: false,
    props: {
      treeDataSource: {
        type: Object as PropType<ITreeDataSource>,
        required: true,
      },
      allowTree: { type: Boolean, default: true },
      defaultOptionValue: {
        type: Array as PropType<{ label: string; value: any }[]>,
        default: undefined,
      },
    },
    setup(props) {
      const initialExpandedKeys: string[] = []
      traverseTree(props.treeDataSource.dataSource, (item) => {
        if (item.children?.length) initialExpandedKeys.push(item.key)
      })
      const expandedKeys = ref(initialExpandedKeys)
      const addNode = (parent?: INodeItem) => {
        const uuid = uid()
        const siblings = parent
          ? (parent.children ?? [])
          : props.treeDataSource.dataSource
        const initialKeyValuePairs = props.defaultOptionValue?.map((item) => ({
          ...item,
        })) || [
          {
            label: 'label',
            value: `${GlobalRegistry.getDesignerMessage(
              'SettingComponents.DataSourceSetter.item',
            )} ${siblings.length + 1}`,
          },
          { label: 'value', value: uuid },
        ]
        const next = siblings.concat({
          key: uuid,
          duplicateKey: uuid,
          map: initialKeyValuePairs,
          children: [],
        })
        if (!parent) {
          props.treeDataSource.dataSource = next
          return
        }
        parent.children = next
        if (!expandedKeys.value.includes(parent.key)) {
          expandedKeys.value = [...expandedKeys.value, parent.key]
        }
        props.treeDataSource.selectedKey = uuid
      }
      // INodeItem → ITreeItem (label = VNode Title : libellé + actions)
      const toItems = (nodes: INodeItem[]): ITreeItem[] => {
        return (nodes || []).map((node) => ({
          key: node.key,
          label: h(Title, {
            item: node,
            treeDataSource: props.treeDataSource,
          }),
          children: toItems(node.children ?? []),
        }))
      }
      return () => {
        const { dataSource, selectedKey } = props.treeDataSource
        const selected = selectedKey && findTreeNode(dataSource, selectedKey)
        return [
          h(Header, {
            title: h(TextWidget, {
              token: 'SettingComponents.DataSourceSetter.dataSourceTree',
            }),
            extra: h(
              Button,
              {
                type: 'text',
                onClick: () => addNode(),
              },
              {
                default: () => [
                  h(IconWidget, { infer: 'Add' }),
                  h(TextWidget, {
                    token: 'SettingComponents.DataSourceSetter.addNode',
                  }),
                ],
              },
            ),
          }),
          props.allowTree
            ? h('div', { class: 'border-b border-border px-2 py-1' }, [
                h(
                  Button,
                  {
                    type: 'text',
                    size: 'small',
                    disabled: !selected,
                    onClick: () => {
                      if (selected) addNode(selected)
                    },
                  },
                  {
                    default: () => [
                      h(IconWidget, { infer: 'Add' }),
                      h(TextWidget, {
                        token: 'SettingComponents.DataSourceSetter.addChild',
                      }),
                    ],
                  },
                ),
              ])
            : null,
          h(
            'div',
            {
              class:
                'h-[300px] max-h-[300px] overflow-auto p-1 text-sm text-foreground',
            },
            [
              h(Tree, {
                items: toItems(dataSource),
                selectedKey,
                expandedKeys: expandedKeys.value,
                'onUpdate:expandedKeys': (keys: string[]) => {
                  expandedKeys.value = keys
                },
                onSelect: (key: string) => {
                  if (key) {
                    props.treeDataSource.selectedKey = key
                  }
                },
              }),
            ],
          ),
        ]
      }
    },
  }) as any,
)
