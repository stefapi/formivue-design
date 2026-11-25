import { defineComponent, h } from 'vue'
import type { ArrayField } from '@formivue/core'
import type { Schema } from '@formivue/json-schema'
import { useField, useFieldSchema, RecursionField } from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'
import { Card as DCard } from '@formivue-design/vue-ui'
import { ArrayBase, ArrayBaseMixin } from '../array-base'
import { useArrayMessage } from '../array-base/messages'
import {
  arrayContainerProps,
  arrayOperations,
  createArrayRowKeys,
} from '../array-base/props'

const isAddition = (schema: Schema) =>
  schema['x-component'] === 'ArrayCards.Addition'

const isIndex = (schema: Schema) => schema['x-component'] === 'ArrayCards.Index'

const isOperation = (schema: Schema) =>
  arrayOperations.some(
    (operation) => schema['x-component'] === `ArrayCards.${operation}`,
  )

const FormivueArrayCards = observer(
  defineComponent({
    name: 'FormivueArrayCards',
    inheritAttrs: false,
    setup(_, { attrs }) {
      const fieldRef = useField() as { value: ArrayField }
      const schemaRef = useFieldSchema()
      const rowKeys = createArrayRowKeys()
      const arrayMessage = useArrayMessage()
      return () => {
        const field = fieldRef.value
        const schema = schemaRef.value
        const records = Array.isArray(field?.value) ? field.value : []
        const keys = rowKeys(records)
        const title = (attrs.title ?? field?.title) as string | undefined
        const cardProps = {
          title,
          size: attrs.size as 'default' | 'small' | undefined,
          bordered: attrs.bordered as boolean | undefined,
        }
        return h(
          ArrayBase,
          { ...attrs, addLabel: arrayMessage('addCard') },
          {
            default: () =>
              h('div', arrayContainerProps(attrs, 'dn-array-cards'), [
                records.length === 0
                  ? h(DCard, cardProps, {
                      default: () =>
                        h(
                          'p',
                          { class: 'text-muted-foreground text-sm' },
                          arrayMessage('empty'),
                        ),
                    })
                  : null,
                ...records.map((_, index) => {
                  const items = Array.isArray(schema?.items)
                    ? (schema.items[index] ?? schema.items[0])
                    : schema?.items
                  const properties = Object.values(items?.properties ?? {})
                  const hasIndex = properties.some(isIndex)
                  const hasOperations =
                    field.pattern === 'editable' && properties.some(isOperation)
                  const renderFields = (
                    filterProperties: (schema: Schema) => boolean,
                  ) =>
                    h(RecursionField, {
                      schema: items,
                      name: index,
                      filterProperties,
                      onlyRenderProperties: true,
                    })
                  return h(
                    ArrayBase.Item,
                    {
                      key: keys[index],
                      index,
                      record: () => fieldRef.value?.value?.[index],
                    },
                    () =>
                      h(DCard, cardProps, {
                        ...(hasIndex
                          ? {
                              title: () =>
                                h(
                                  'div',
                                  {
                                    class:
                                      'flex flex-wrap items-baseline gap-1',
                                  },
                                  [renderFields(isIndex), title],
                                ),
                            }
                          : {}),
                        ...(hasOperations || attrs.extra
                          ? {
                              extra: () => [
                                hasOperations
                                  ? renderFields(isOperation)
                                  : null,
                                attrs.extra,
                              ],
                            }
                          : {}),
                        default: () =>
                          items
                            ? h(RecursionField, {
                                schema: items,
                                name: index,
                                filterProperties: (child: Schema) =>
                                  !isIndex(child) &&
                                  !isOperation(child) &&
                                  !isAddition(child),
                              })
                            : null,
                      }),
                  )
                }),
                ...(schema?.mapProperties((child, name) =>
                  isAddition(child)
                    ? h(RecursionField, { key: name, schema: child, name })
                    : null,
                ) ?? []),
              ]),
          },
        )
      }
    },
  }) as any,
) as any

export const ArrayCards = ArrayBaseMixin.mixin(FormivueArrayCards) as any
