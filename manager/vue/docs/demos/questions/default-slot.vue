<template>
  <FormProvider :form="form">
    <SchemaField :schema="schema" />
  </FormProvider>
</template>

<script setup>
import { createForm } from '@formivue/core'
import { FormProvider, createSchemaField } from '@formivue/vue'
import { Button } from '../../ui'

const { SchemaField } = createSchemaField({
  components: {
    Button,
  },
})

const schema = {
  type: 'object',
  properties: {
    button: {
      type: 'void',
      'x-component': 'Button',
      'x-content': 'A plain button',
    },
  },
}

const form = createForm()
</script>
