import { defineComponent, h } from 'vue'
import { TreeNode, createResource } from '@formivue-design/core'
import { observer } from '@formivue/reactive-vue'
import {
  useTreeNode,
  TreeNodeWidget,
  DroppableWidget,
  useNodeIdProps,
  type DnFC,
} from '@formivue-design/vue'
import { Card as DCard } from '@formivue-design/vue-ui'
import { ArrayBase, ArrayBaseMixin, arrayMessage } from '../../array-base'
import { LoadTemplate } from '../../common/LoadTemplate'
import { useDropTemplate } from '../../hooks'
import { createEnsureTypeItemsNode, matchComponent } from '../../shared'
import {
  arrayActionPosition,
  arrayContainerProps,
  arrayOperations,
  createArrayBehavior,
  createArrayControl,
} from '../ArrayBase'

const ensureItems = createEnsureTypeItemsNode('object')
const operations = arrayOperations.map((name) => `ArrayCards.${name}`)
const indexName = 'ArrayCards.Index'
const additionName = 'ArrayCards.Addition'

const renderNode = (node: TreeNode) => h(TreeNodeWidget, { key: node.id, node })

export const ArrayCards: DnFC<any> = observer(
  defineComponent({
    name: 'DArrayCardsMaterial',
    inheritAttrs: false,
    setup(_, { attrs }) {
      const node = useTreeNode()
      const nodeId = useNodeIdProps()
      const designer = useDropTemplate('ArrayCards', (source) => [
        new TreeNode({
          componentName: 'Field',
          props: { type: 'object' },
          children: [
            createArrayControl(indexName),
            ...source,
            ...operations.map(createArrayControl),
          ],
        }),
        createArrayControl(additionName),
      ])
      return () => {
        if (!node) return null
        const items = node.children.find(
          (child) => !matchComponent(child, additionName),
        )
        const additions = node.children.filter((child) =>
          matchComponent(child, additionName),
        )
        const children = items?.children ?? []
        const indexes = children.filter((child) =>
          matchComponent(child, indexName),
        )
        const controls = children.filter((child) =>
          matchComponent(child, operations),
        )
        const fields = children.filter(
          (child) => !matchComponent(child, [indexName, ...operations]),
        )
        const missingOperations = operations.filter(
          (name) => !controls.some((child) => matchComponent(child, name)),
        )
        const actions = [
          ...(indexes.length
            ? []
            : [
                {
                  title: node.getMessage('addIndex'),
                  icon: 'AddIndex',
                  onClick: () =>
                    ensureItems(node).prepend(createArrayControl(indexName)),
                },
              ]),
          ...(additions.length && !missingOperations.length
            ? []
            : [
                {
                  title: node.getMessage('addOperation'),
                  icon: 'AddOperation',
                  onClick: () => {
                    const template = ensureItems(node)
                    if (missingOperations.length)
                      template.append(
                        ...missingOperations.map(createArrayControl),
                      )
                    if (!additions.length)
                      node.append(createArrayControl(additionName))
                  },
                },
              ]),
        ]
        return h(
          ArrayBase,
          { disabled: true, addLabel: arrayMessage('addCard') },
          () =>
            h(
              'div',
              {
                ...nodeId,
                ...arrayContainerProps(attrs, 'dn-array-cards relative'),
              },
              [
                items
                  ? h(ArrayBase.Item, { index: 0, record: null }, () =>
                      h(
                        DCard,
                        {
                          title: attrs.title as string,
                          size: attrs.size as 'default' | 'small' | undefined,
                          bordered: attrs.bordered as boolean | undefined,
                        },
                        {
                          ...(indexes.length || attrs.title
                            ? {
                                title: () =>
                                  h(
                                    'div',
                                    {
                                      class:
                                        'flex flex-wrap items-baseline gap-1',
                                    },
                                    [
                                      ...indexes.map(renderNode),
                                      attrs.title
                                        ? h(
                                            'span',
                                            {
                                              [designer.props
                                                .contentEditableAttrName]:
                                                'x-component-props.title',
                                            },
                                            attrs.title as string,
                                          )
                                        : null,
                                    ],
                                  ),
                              }
                            : {}),
                          ...(controls.length || attrs.extra
                            ? {
                                extra: () => [
                                  ...controls.map(renderNode),
                                  attrs.extra,
                                ],
                              }
                            : {}),
                          default: () =>
                            h(
                              DroppableWidget,
                              {
                                node: items,
                                hasChildren:
                                  fields.length > 0 ||
                                  !!items.props['x-component'],
                              },
                              () =>
                                items.props['x-component']
                                  ? renderNode(items)
                                  : fields.map(renderNode),
                            ),
                        },
                      ),
                    )
                  : h(DroppableWidget, { hasChildren: false }),
                ...additions.map(renderNode),
                actions.length
                  ? h(LoadTemplate, {
                      overlay: true,
                      style: arrayActionPosition,
                      actions,
                    })
                  : null,
              ],
            ),
        )
      }
    },
  }) as any,
) as any

ArrayBaseMixin.mixin(ArrayCards)

ArrayCards.Behavior = createArrayBehavior('ArrayCards')

ArrayCards.Resource = createResource({
  icon: 'ArrayCardsSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        type: 'array',
        'x-decorator': 'FormItem',
        'x-component': 'ArrayCards',
      },
    },
  ],
})
