<template>
  <FormProvider :form="form">
    <SchemaField>
      <SchemaArrayField name="custom" x-component="ArrayItems">
        <SchemaObjectField>
          <SchemaStringField name="input" x-component="Input" />
        </SchemaObjectField>
      </SchemaArrayField>
    </SchemaField>
  </FormProvider>
</template>

<script setup>
import { defineComponent, h } from 'vue'
import { createForm } from '@formivue/core'
import {
  FormProvider,
  createSchemaField,
  RecursionField,
  useField,
  useFieldSchema,
} from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'
import { Button, Input, Space } from '../../../ui'

const ArrayItems = observer(
  defineComponent({
    setup() {
      const fieldRef = useField()
      const schemaRef = useFieldSchema()

      return () => {
        const field = fieldRef.value
        const schema = schemaRef.value
        const items = field.value?.map((item, index) => {
          return h('div', { key: item.id, class: 'mb-2.5' }, [
            h(Space, [
              h(RecursionField, { schema: schema.items, name: index }),
              h(
                Button,
                { onClick: () => field.remove(index) },
                { default: () => 'Remove' },
              ),
            ]),
          ])
        })
        const button = h(
          Button,
          { onClick: () => field.push({ id: Date.now() }) },
          { default: () => 'Add' },
        )
        return h('div', [items, button])
      }
    },
  }),
)

const { SchemaField, SchemaStringField, SchemaArrayField, SchemaObjectField } =
  createSchemaField({
    components: {
      ArrayItems,
      Input,
    },
  })

const form = createForm()
</script>
