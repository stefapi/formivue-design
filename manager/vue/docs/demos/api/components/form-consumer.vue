<template>
  <FormProvider :form="form">
    <Field name="input" :component="[Input]" />
    <FormConsumer>
      <template #default="{ form }">
        {{ form.values.input }}
      </template>
    </FormConsumer>
  </FormProvider>
</template>

<script setup>
import { createForm } from '@formivue/core'
import { FormProvider, Field, FormConsumer } from '@formivue/vue'
import { Input } from '../../../ui'

const form = createForm()
</script>
