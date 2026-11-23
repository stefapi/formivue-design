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
                'x-component': 'Input',
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
import { FormProvider, createSchemaField, RecursionField } from '@formivue/vue'
import { Input } from '../../../ui'

const Custom = defineComponent({
  props: ['name', 'schema'],
  setup(props) {
    return () =>
      h(RecursionField, {
        name: props.name,
        schema: props.schema,
        onlyRenderProperties: true,
      })
  },
})

const { SchemaField, SchemaObjectField } = createSchemaField({
  components: {
    Custom,
    Input,
  },
})

const form = createForm()
</script>
