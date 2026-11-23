<template>
  <FormProvider :form="form">
    <SchemaField :schema="schema" />
  </FormProvider>
</template>

<script setup>
import { createForm } from '@formivue/core'
import { FormProvider, createSchemaField } from '@formivue/vue'
import { Input } from '../../ui'

const { SchemaField } = createSchemaField({
  components: {
    Input,
  },
})

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      'x-component': 'Input',
      'x-component-props': {
        '@change': (value) => console.log(value),
        onFocus: (event) => console.log(event),
      },
    },
  },
}

const form = createForm()
</script>
