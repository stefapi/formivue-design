<template>
  <FormProvider :form="form">
    <SchemaField>
      <SchemaStringField name="input" x-component="Input" />
    </SchemaField>
  </FormProvider>
</template>

<script setup>
import { createForm } from '@formivue/core'
import { FormProvider, createSchemaField } from '@formivue/vue'
import { Input } from '../../../ui'

const { SchemaField, SchemaStringField } = createSchemaField({
  components: {
    Input,
  },
})

const form = createForm()
</script>
