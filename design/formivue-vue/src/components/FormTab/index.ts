// formivue/vue — FormTab matériau designer (port de l'ère : onglets depuis les
// enfants du nœud, titre éditable in-canvas, LoadTemplate « addTabPane »,
// useDropTemplate qui enveloppe la source dans un TabPane).
import { defineComponent, h, ref, type Component } from 'vue'
import { TreeNode, createBehavior, createResource } from '@formivue-design/core'
import { observer } from '@formivue/reactive-vue'
import {
  useTreeNode,
  useNodeIdProps,
  TreeNodeWidget,
  DroppableWidget,
  useDesigner,
  type DnFC,
} from '@formivue-design/vue'
import { Tabs } from '@formivue-design/vue-ui'
import { LoadTemplate } from '../../common/LoadTemplate'
import { useDropTemplate } from '../../hooks'
import { createVoidFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'
import { matchComponent, derived } from '../../shared'

const parseTabs = (parent: TreeNode) => {
  const tabs: TreeNode[] = []
  parent.children.forEach((node) => {
    if (matchComponent(node, 'FormTab.TabPane')) {
      tabs.push(node)
    }
  })
  return tabs
}

const getCorrectActiveKey = (activeKey: string, tabs: TreeNode[]) => {
  if (tabs.length === 0) return
  if (tabs.some((node) => node.id === activeKey)) return activeKey
  return tabs[tabs.length - 1].id
}

export const FormTab: DnFC<any> & { TabPane?: Component } = observer(
  defineComponent({
    name: 'DFormTabMaterial',
    inheritAttrs: false,
    setup(_, { attrs }) {
      const activeKey = ref<string>()
      const nodeId = useNodeIdProps()
      const node = useTreeNode()
      const designer = useDesigner()
      useDropTemplate('FormTab', (source) => {
        return [
          new TreeNode({
            componentName: 'Field',
            props: {
              type: 'void',
              'x-component': 'FormTab.TabPane',
              'x-component-props': {
                tab: `Unnamed Title`,
              },
            },
            children: source,
          }),
        ]
      })
      const tabs = derived(() => parseTabs(node as any))
      return () => {
        const actions = [
          {
            title: node?.getMessage('addTabPane'),
            icon: 'AddPanel',
            onClick: () => {
              const tabPane = new TreeNode({
                componentName: 'Field',
                props: {
                  type: 'void',
                  'x-component': 'FormTab.TabPane',
                  'x-component-props': { tab: 'Unnamed Title' },
                },
              })
              node?.append(tabPane)
              activeKey.value = tabPane.id
            },
          },
        ]
        if (!node?.children?.length) {
          return h(DroppableWidget, {
            actions,
            style: attrs.style,
            className: attrs.class as string,
          })
        }
        return h(
          Tabs,
          {
            ...nodeId,
            ...attrs,
            class: ['relative', attrs.class],
            designerActions: h(LoadTemplate, { overlay: true, actions }),
            tabs: tabs.value.map((tab) => {
              const props = tab.props['x-component-props'] || {}
              return {
                key: tab.id,
                label: h(
                  'span',
                  {
                    'data-content-editable': 'x-component-props.tab',
                    'data-content-editable-node-id': tab.id,
                  },
                  [props.tab as string],
                ),
              }
            }),
            modelValue: getCorrectActiveKey(activeKey.value, tabs.value),
            'onUpdate:modelValue': (id: string) => {
              activeKey.value = id
            },
          },
          {
            default: ({ key }: { key: string }) => {
              const tab = tabs.value.find((item) => item.id === key)
              if (!tab) return null
              const tabProps = tab.props['x-component-props'] || {}
              return h(
                'div',
                {
                  [designer?.props?.nodeIdAttrName || 'data-designer-node-id']:
                    tab.id,
                  style: [{ padding: '20px 0' }, tabProps.style],
                },
                [
                  tab.children.length
                    ? h(TreeNodeWidget, { node: tab })
                    : h(DroppableWidget, { node: tab }),
                ],
              )
            },
          },
        )
      }
    },
  }) as any,
) as any

FormTab.TabPane = defineComponent({
  name: 'DFormTabTabPane',
  setup(_, { slots }) {
    return () => slots.default?.()
  },
}) as any

FormTab.Behavior = createBehavior(
  {
    name: 'FormTab',
    extends: ['Field'],
    selector: (node) => node.props['x-component'] === 'FormTab',
    designerProps: {
      droppable: true,
      allowAppend: (target, source) =>
        target.children.length === 0 ||
        source.every((node) => node.props['x-component'] === 'FormTab.TabPane'),
      propsSchema: createVoidFieldSchema(AllSchemas.FormTab),
    },
    designerLocales: AllLocales.FormTab,
  },
  {
    name: 'FormTab.TabPane',
    extends: ['Field'],
    selector: (node) => node.props['x-component'] === 'FormTab.TabPane',
    designerProps: {
      droppable: true,
      allowDrop: (node) => node.props['x-component'] === 'FormTab',
      propsSchema: createVoidFieldSchema(AllSchemas.FormTab.TabPane),
    },
    designerLocales: AllLocales.FormTabPane,
  },
)

FormTab.Resource = createResource({
  icon: 'TabSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        type: 'void',
        'x-component': 'FormTab',
      },
    },
  ],
})
