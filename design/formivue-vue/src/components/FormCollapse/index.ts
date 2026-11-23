// formivue/vue — FormCollapse matériau designer (port de l'ère : panneaux depuis
// les enfants du nœud — **tous ouverts in-canvas** (comportement d'ère : le
// rendu passe activeKey = tous les ids de panneaux), header éditable,
// LoadTemplate « addCollapsePanel », useDropTemplate avec expansion).
import { defineComponent, h, type Component } from 'vue'
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
import { FormCollapse as DFormCollapse } from '@formivue-design/vue-ui'
import { LoadTemplate } from '../../common/LoadTemplate'
import { useDropTemplate } from '../../hooks'
import { createVoidFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'
import { matchComponent, derived } from '../../shared'

const parseCollapse = (parent: TreeNode) => {
  const panels: TreeNode[] = []
  parent.children.forEach((node) => {
    if (matchComponent(node, 'FormCollapse.CollapsePanel')) {
      panels.push(node)
    }
  })
  return panels
}

export const FormCollapse: DnFC<any> & { CollapsePanel?: Component } = observer(
  defineComponent({
    name: 'DFormCollapseMaterial',
    inheritAttrs: false,
    setup(_, { attrs }) {
      const node = useTreeNode()
      const nodeId = useNodeIdProps()
      const designer = useDesigner()
      useDropTemplate('FormCollapse', (source) => [
        new TreeNode({
          componentName: 'Field',
          props: {
            type: 'void',
            'x-component': 'FormCollapse.CollapsePanel',
            'x-component-props': {
              header: `Unnamed Title`,
            },
          },
          children: source,
        }),
      ])
      const panels = derived(() => parseCollapse(node as any))
      return () => {
        const actions = [
          {
            title: node?.getMessage('addCollapsePanel'),
            icon: 'AddPanel',
            onClick: () =>
              node?.append(
                new TreeNode({
                  componentName: 'Field',
                  props: {
                    type: 'void',
                    'x-component': 'FormCollapse.CollapsePanel',
                    'x-component-props': { header: 'Unnamed Title' },
                  },
                }),
              ),
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
          DFormCollapse,
          {
            ...nodeId,
            ...attrs,
            class: ['relative', attrs.class],
            designerActions: h(LoadTemplate, { overlay: true, actions }),
            collapses: panels.value.map((panel) => {
              const props = panel.props['x-component-props'] || {}
              return {
                key: panel.id,
                title: props.header as string,
              }
            }),
            // comportement d'ère : tous les panneaux ouverts in-canvas
            accordion: false,
            activeKeys: panels.value.map((panel) => panel.id),
          },
          panels.value.reduce<Record<string, any>>((slots, panel) => {
            const props = panel.props['x-component-props'] || {}
            slots[`${panel.id}-header`] = () =>
              h(
                'span',
                {
                  'data-content-editable': 'x-component-props.header',
                  'data-content-editable-node-id': panel.id,
                },
                [props.header as string],
              )
            slots[panel.id] = () =>
              h(
                'div',
                {
                  [designer?.props?.nodeIdAttrName || 'data-designer-node-id']:
                    panel.id,
                  style: props.style,
                },
                [
                  panel.children.length
                    ? h(TreeNodeWidget, { node: panel })
                    : h(DroppableWidget, { node: panel }),
                ],
              )
            return slots
          }, {}),
        )
      }
    },
  }) as any,
) as any

FormCollapse.CollapsePanel = defineComponent({
  name: 'DFormCollapsePanel',
  setup(_, { slots }) {
    return () => slots.default?.()
  },
}) as any

FormCollapse.Behavior = createBehavior(
  {
    name: 'FormCollapse',
    extends: ['Field'],
    selector: (node) => node.props['x-component'] === 'FormCollapse',
    designerProps: {
      droppable: true,
      allowAppend: (target, source) =>
        target.children.length === 0 ||
        source.every(
          (node) => node.props['x-component'] === 'FormCollapse.CollapsePanel',
        ),
      propsSchema: createVoidFieldSchema(AllSchemas.FormCollapse),
    },
    designerLocales: AllLocales.FormCollapse,
  },
  {
    name: 'FormCollapse.CollapsePanel',
    extends: ['Field'],
    selector: (node) =>
      node.props['x-component'] === 'FormCollapse.CollapsePanel',
    designerProps: {
      droppable: true,
      allowDrop: (node) => node.props['x-component'] === 'FormCollapse',
      propsSchema: createVoidFieldSchema(AllSchemas.FormCollapse.CollapsePanel),
    },
    designerLocales: AllLocales.FormCollapsePanel,
  },
)

FormCollapse.Resource = createResource({
  icon: 'CollapseSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        type: 'void',
        'x-component': 'FormCollapse',
      },
    },
  ],
})
