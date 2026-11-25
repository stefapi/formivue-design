import { defineComponent, h } from 'vue'
import type { ArrayField } from '@formivue/core'
import type { Schema } from '@formivue/json-schema'
import { useField, useFieldSchema, RecursionField } from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'
import { Table as DTable } from '@formivue-design/vue-ui'
import { ArrayBase, ArrayBaseMixin } from '../array-base'
import { useArrayMessage } from '../array-base/messages'
import { arrayContainerProps, createArrayRowKeys } from '../array-base/props'

interface ColumnSource {
  name: string
  props: Record<string, any>
  schema: Schema
}

const getColumns = (schema?: Schema): ColumnSource[] => {
  if (!schema) return []
  if (schema['x-component'] === 'ArrayTable.Column') {
    const props = schema['x-component-props'] ?? {}
    const name = schema.name ?? props.dataIndex
    return name ? [{ name: String(name), props, schema }] : []
  }
  return (schema.mapProperties((child) => getColumns(child)) ?? []).flat()
}

const FormivueArrayTable = observer(
  defineComponent({
    name: 'FormivueArrayTable',
    inheritAttrs: false,
    setup(_, { attrs }) {
      const fieldRef = useField() as { value: ArrayField }
      const schemaRef = useFieldSchema()
      const rowKeys = createArrayRowKeys()
      const arrayMessage = useArrayMessage()
      return () => {
        const schema = schemaRef.value
        const field = fieldRef.value
        const records = Array.isArray(field?.value) ? field.value : []
        const keys = rowKeys(records)
        const items = Array.isArray(schema?.items)
          ? schema.items
          : [schema?.items]
        const rowColumns = items.map((item) =>
          getColumns(item).filter(
            ({ schema }) =>
              schema['x-display'] !== 'hidden' &&
              schema['x-display'] !== 'none',
          ),
        )
        const columns = new Map<string, ColumnSource>()
        for (const group of rowColumns) {
          for (const column of group) {
            if (!columns.has(column.name)) columns.set(column.name, column)
          }
        }
        const additions =
          schema?.mapProperties((child, name) =>
            child['x-component'] === 'ArrayTable.Addition'
              ? h(RecursionField, { key: name, schema: child, name })
              : null,
          ) ?? []
        return h(
          ArrayBase,
          { ...attrs, addLabel: arrayMessage('addRow') },
          {
            default: () =>
              h('div', arrayContainerProps(attrs, 'dn-array-table'), [
                h(
                  DTable,
                  {
                    columns: Array.from(
                      columns.values(),
                      ({ name, props }) => ({
                        key: name,
                        title: String(props.title ?? name),
                        align: props.align,
                        width: props.width,
                      }),
                    ),
                    dataSource: records,
                    rowKey:
                      (attrs.rowKey as InstanceType<
                        typeof DTable
                      >['$props']['rowKey']) ??
                      ((_: Record<string, unknown>, index: number) =>
                        keys[index]),
                    onRowClick: attrs.onRowClick as InstanceType<
                      typeof DTable
                    >['$props']['onRowClick'],
                  },
                  {
                    ...Object.fromEntries(
                      Array.from(columns.keys(), (name) => [
                        name,
                        ({ index }: { index: number }) => {
                          const group = rowColumns[index] ?? rowColumns[0]
                          const column = group?.find(
                            (source) => source.name === name,
                          )
                          if (!column) return null
                          return h(
                            ArrayBase.Item,
                            {
                              index,
                              record: () => fieldRef.value?.value?.[index],
                            },
                            () =>
                              h('div', { style: column.props.style }, [
                                h(RecursionField, {
                                  schema: column.schema,
                                  name: index,
                                  onlyRenderProperties: true,
                                }),
                              ]),
                          )
                        },
                      ]),
                    ),
                    empty: () => arrayMessage('empty'),
                  },
                ),
                ...additions,
              ]),
          },
        )
      }
    },
  }) as any,
) as any

export const Column = defineComponent({
  name: 'FormivueArrayTableColumn',
  setup(_, { slots }) {
    return () => slots.default?.()
  },
})

FormivueArrayTable.Column = Column

export const ArrayTable = ArrayBaseMixin.mixin(FormivueArrayTable) as any
