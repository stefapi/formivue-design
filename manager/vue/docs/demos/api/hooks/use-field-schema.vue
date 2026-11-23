<template>
  <FormProvider :form="form">
    <SchemaField>
      <SchemaObjectField
        name="custom"
        x-component="Custom"
        :x-component-props="{
          schema: {
            type: 'object',
            properties: {
              input: {
                type: 'string',
                'x-component': 'Custom',
              },
            },
          },
        }"
      />
    </SchemaField>
  </FormProvider>
</template>

<script setup>
import { defineComponent, h } from 'vue'
import { createForm } from '@formivue/core'
import { FormProvider, createSchemaField, useFieldSchema } from '@formivue/vue'

const Custom = defineComponent({
  setup() {
    const schemaRef = useFieldSchema()
    return () => {
      const schema = schemaRef.value
      return h('div', { class: 'whitespace-pre' }, [
        JSON.stringify(schema.toJSON(), null, 4),
      ])
    }
  },
})

const { SchemaField, SchemaObjectField } = createSchemaField({
  components: {
    Custom,
  },
})

const form = createForm({ validateFirst: true })
</script>
