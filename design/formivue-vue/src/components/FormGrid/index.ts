// formivue/vue — FormGrid matériau designer (port de l'ère : grille + LoadTemplate
// « addGridColumn », GridColumn = DroppableWidget à span éditable, behavior
// resizable d'ère conservé verbatim — le moteur gère le redimensionnement).
import { defineComponent, h, type Component } from 'vue'
import { TreeNode, createBehavior, createResource } from '@formivue-design/core'
import { observer } from '@formivue/reactive-vue'
import {
  useTreeNode,
  useNodeIdProps,
  DroppableWidget,
  type DnFC,
} from '@formivue-design/vue'
import { LoadTemplate } from '../../common/LoadTemplate'
import { createFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'
import { FormGridBinding } from './binding'

export const FormGrid: DnFC<any> & { GridColumn?: Component } = observer(
  defineComponent({
    name: 'DFormGridMaterial',
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      const node = useTreeNode()
      const nodeId = useNodeIdProps()
      return () => {
        const currentNode = node as any
        if (!currentNode || currentNode.children.length === 0) {
          return h(DroppableWidget, attrs as any, slots)
        }
        return h(
          FormGridBinding,
          { ...nodeId, ...attrs, class: ['dn-grid relative', attrs.class] },
          {
            ...slots,
            designerActions: () =>
              h(LoadTemplate, {
                overlay: true,
                actions: [
                  {
                    title: currentNode.getMessage('addGridColumn'),
                    icon: 'AddColumn',
                    onClick: () => {
                      const column = new TreeNode({
                        componentName: 'Field',
                        props: {
                          type: 'void',
                          'x-component': 'FormGrid.GridColumn',
                        },
                      })
                      currentNode.append(column)
                    },
                  },
                ],
              }),
          },
        )
      }
    },
  }) as any,
) as any

FormGrid.GridColumn = observer(
  defineComponent({
    name: 'DFormGridGridColumn',
    inheritAttrs: false,
    props: {
      gridSpan: { type: Number, default: undefined },
    },
    setup(props, { attrs, slots }) {
      return () =>
        h(
          DroppableWidget,
          {
            placeholder: true,
            ...(attrs as Record<string, any>),
            'data-grid-span': props.gridSpan,
          } as any,
          slots,
        )
    },
  }) as any,
) as any

FormGrid.Behavior = createBehavior(
  {
    name: 'FormGrid',
    extends: ['Field'],
    selector: (node) => node.props['x-component'] === 'FormGrid',
    designerProps: {
      droppable: true,
      allowDrop: (node) => node.props['x-component'] !== 'FormGrid',
      propsSchema: createFieldSchema(AllSchemas.FormGrid),
    },
    designerLocales: AllLocales.FormGrid,
  },
  {
    name: 'FormGrid.GridColumn',
    extends: ['Field'],
    selector: (node) => node.props['x-component'] === 'FormGrid.GridColumn',
    designerProps: {
      droppable: true,
      resizable: {
        width(node) {
          const span = Number(node.props['x-component-props']?.gridSpan ?? 1)
          return {
            plus: () => {
              if (span + 1 > 12) return
              node.props['x-component-props'] =
                node.props['x-component-props'] || {}
              node.props['x-component-props'].gridSpan = span + 1
            },
            minus: () => {
              if (span - 1 < 1) return
              node.props['x-component-props'] =
                node.props['x-component-props'] || {}
              node.props['x-component-props'].gridSpan = span - 1
            },
          }
        },
      },
      resizeXPath: 'x-component-props.gridSpan',
      resizeStep: 1,
      resizeMin: 1,
      resizeMax: 12,
      allowDrop: (node) => node.props['x-component'] === 'FormGrid',
      propsSchema: createFieldSchema(AllSchemas.FormGrid.GridColumn),
    },
    designerLocales: AllLocales.FormGridColumn,
  },
)

FormGrid.Resource = createResource({
  icon: 'GridSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        type: 'void',
        'x-component': 'FormGrid',
      },
      children: [
        {
          componentName: 'Field',
          props: {
            type: 'void',
            'x-component': 'FormGrid.GridColumn',
          },
        },
        {
          componentName: 'Field',
          props: {
            type: 'void',
            'x-component': 'FormGrid.GridColumn',
          },
        },
        {
          componentName: 'Field',
          props: {
            type: 'void',
            'x-component': 'FormGrid.GridColumn',
          },
        },
      ],
    },
  ],
})
