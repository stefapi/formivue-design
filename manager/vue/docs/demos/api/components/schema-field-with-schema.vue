<template>
  <FormProvider :form="form">
    <SchemaField
      :schema="{
        type: 'object',
        properties: {
          input: {
            type: 'string',
            'x-component': 'Input',
          },
        },
      }"
    >
    </SchemaField>
  </FormProvider>
</template>

<script setup>
import { createForm } from '@formivue/core'
import { FormProvider, createSchemaField } from '@formivue/vue'
import { Input } from '../../../ui'

const { SchemaField } = createSchemaField({
  components: {
    Input,
  },
})

const form = createForm()
</script>
