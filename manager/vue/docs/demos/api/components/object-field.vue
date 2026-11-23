<template>
  <FormProvider :form="form">
    <ObjectField name="object">
      <template #default="{ field }">
        <div
          v-for="key in Object.keys(field.value || {})"
          :key="key"
          class="mb-2.5"
        >
          <Space>
            <Field :name="key" :component="[Input, { placeholder: key }]" />
            <Button @click="field.removeProperty(key)"> Remove </Button>
          </Space>
        </div>
        <Space>
          <Field
            name="propertyName"
            basePath=""
            required
            :component="[Input, { placeholder: 'Property Name' }]"
          />
          <Button @click="addPropertyToField(field)"> Add </Button>
        </Space>
      </template>
    </ObjectField>
  </FormProvider>
</template>

<script setup>
import { createForm } from '@formivue/core'
import { FormProvider, ObjectField, Field } from '@formivue/vue'
import { Button, Input, Space } from '../../../ui'

const form = createForm()

const addPropertyToField = (field) => {
  const name = form.values.propertyName
  if (name && !form.existValuesIn(`object.${name}`)) {
    field.addProperty(name, '')
    form.deleteValuesIn('propertyName')
  }
}
</script>
