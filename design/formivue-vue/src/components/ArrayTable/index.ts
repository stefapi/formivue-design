import { defineComponent, h } from 'vue'
import { TreeNode, createBehavior, createResource } from '@formivue-design/core'
import { observer } from '@formivue/reactive-vue'
import {
  useTreeNode,
  TreeNodeWidget,
  DroppableWidget,
  useNodeIdProps,
  type DnFC,
} from '@formivue-design/vue'
import { Table as DTable } from '@formivue-design/vue-ui'
import { ArrayBase, ArrayBaseMixin, arrayMessage } from '../../array-base'
import { LoadTemplate } from '../../common/LoadTemplate'
import { createEnsureTypeItemsNode, matchComponent } from '../../shared'
import { useDropTemplate } from '../../hooks'
import {
  arrayActionPosition,
  arrayContainerProps,
  arrayOperations,
  createArrayBehavior,
  createArrayControl,
} from '../ArrayBase'
import { createVoidFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

const ensureItems = createEnsureTypeItemsNode('object')
const operations = arrayOperations.map((name) => `ArrayTable.${name}`)
const sortName = 'ArrayTable.SortHandle'
const indexName = 'ArrayTable.Index'
const additionName = 'ArrayTable.Addition'
const columnName = 'ArrayTable.Column'

const createColumn = (
  title = arrayMessage('column'),
  children: TreeNode[] = [],
) =>
  new TreeNode({
    componentName: 'Field',
    props: {
      type: 'void',
      'x-component': columnName,
      'x-component-props': { title },
    },
    children,
  })

const createTableTemplate = (source: TreeNode[]) => {
  const titles = source.map((child) => {
    const title = child.props.title
    child.props.title = undefined
    return title
  })
  return [
    new TreeNode({
      componentName: 'Field',
      props: { type: 'object' },
      children: [
        createColumn('', [createArrayControl(sortName)]),
        createColumn('#', [createArrayControl(indexName)]),
        createColumn(titles.length === 1 ? titles[0] : undefined, source),
        createColumn(
          arrayMessage('actions'),
          operations.map(createArrayControl),
        ),
      ],
    }),
    createArrayControl(additionName),
  ]
}

const renderNode = (node: TreeNode) => h(TreeNodeWidget, { key: node.id, node })

export const ArrayTable: DnFC<any> = observer(
  defineComponent({
    name: 'DArrayTableMaterial',
    inheritAttrs: false,
    setup(_, { attrs }) {
      const node = useTreeNode()
      const nodeId = useNodeIdProps()
      const { props: designerProps } = useDropTemplate(
        'ArrayTable',
        createTableTemplate,
      )
      useDropTemplate(columnName, (source) => {
        source.forEach((child) => {
          child.props.title = undefined
        })
        return source
      })
      return () => {
        if (!node) return null
        const items = node.children.find(
          (child) => child.props.type === 'object',
        )
        const columns =
          items?.children.filter((child) =>
            matchComponent(child, columnName),
          ) ?? []
        const additions = node.children.filter((child) =>
          matchComponent(child, additionName),
        )
        const sort = columns.find((column) =>
          column.children.some((child) => matchComponent(child, sortName)),
        )
        const index = columns.find((column) =>
          column.children.some((child) => matchComponent(child, indexName)),
        )
        const actionColumn = columns.find((column) =>
          column.children.some((child) => matchComponent(child, operations)),
        )
        const missingOperations = operations.filter(
          (name) =>
            !columns.some((column) =>
              column.children.some((child) => matchComponent(child, name)),
            ),
        )
        const actions = [
          ...(sort
            ? []
            : [
                {
                  title: node.getMessage('addSortHandle'),
                  icon: 'AddSort',
                  onClick: () =>
                    ensureItems(node).prepend(
                      createColumn('', [createArrayControl(sortName)]),
                    ),
                },
              ]),
          ...(index
            ? []
            : [
                {
                  title: node.getMessage('addIndex'),
                  icon: 'AddIndex',
                  onClick: () => {
                    const newColumn = createColumn('#', [
                      createArrayControl(indexName),
                    ])
                    if (sort) sort.insertAfter(newColumn)
                    else ensureItems(node).prepend(newColumn)
                  },
                },
              ]),
          {
            title: node.getMessage('addColumn'),
            icon: 'AddColumn',
            onClick: () => {
              const newColumn = createColumn()
              if (actionColumn) actionColumn.insertBefore(newColumn)
              else ensureItems(node).append(newColumn)
            },
          },
          ...(additions.length && !missingOperations.length
            ? []
            : [
                {
                  title: node.getMessage('addOperation'),
                  icon: 'AddOperation',
                  onClick: () => {
                    const template = ensureItems(node)
                    if (missingOperations.length) {
                      const controls = missingOperations.map(createArrayControl)
                      if (actionColumn) actionColumn.append(...controls)
                      else
                        template.append(
                          createColumn(arrayMessage('actions'), controls),
                        )
                    }
                    if (!additions.length)
                      node.append(createArrayControl(additionName))
                  },
                },
              ]),
        ]
        const renderTable = () =>
          h(ArrayBase.Item, { index: 0, record: null }, () =>
            h(
              DTable,
              {
                columns: columns.map((column) => {
                  const props = column.props['x-component-props'] ?? {}
                  return {
                    key: column.id,
                    title: h(
                      'div',
                      {
                        [designerProps.nodeIdAttrName]: column.id,
                        [designerProps.contentEditableAttrName]:
                          'x-component-props.title',
                      },
                      String(props.title ?? arrayMessage('column') ?? ''),
                    ),
                    align: props.align,
                    width: props.width,
                  }
                }),
                dataSource: [{}],
              },
              Object.fromEntries(
                columns.map((column) => [
                  column.id,
                  () =>
                    h(
                      DroppableWidget,
                      {
                        node: column,
                        style: column.props['x-component-props']?.style,
                      },
                      () => column.children.map(renderNode),
                    ),
                ]),
              ),
            ),
          )
        return h(
          ArrayBase,
          { disabled: true, addLabel: arrayMessage('addRow') },
          () =>
            h(
              'div',
              {
                ...nodeId,
                ...arrayContainerProps(attrs, 'dn-array-table relative'),
              },
              [
                columns.length
                  ? renderTable()
                  : h(DroppableWidget, { node: items, hasChildren: false }),
                ...additions.map(renderNode),
                h(LoadTemplate, {
                  overlay: true,
                  style: arrayActionPosition,
                  actions,
                }),
              ],
            ),
        )
      }
    },
  }) as any,
) as any

ArrayBaseMixin.mixin(ArrayTable)

ArrayTable.Behavior = createBehavior(createArrayBehavior('ArrayTable'), {
  name: columnName,
  extends: ['Field'],
  selector: (node) => node.props['x-component'] === columnName,
  designerProps: {
    droppable: true,
    allowDrop: (node) =>
      node.props.type === 'object' &&
      node.parent?.props?.['x-component'] === 'ArrayTable',
    propsSchema: createVoidFieldSchema(AllSchemas.ArrayTable.Column),
  },
  designerLocales: AllLocales.ArrayTableColumn,
})

ArrayTable.Resource = createResource({
  icon: 'ArrayTableSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        type: 'array',
        'x-decorator': 'FormItem',
        'x-component': 'ArrayTable',
      },
    },
  ],
})
