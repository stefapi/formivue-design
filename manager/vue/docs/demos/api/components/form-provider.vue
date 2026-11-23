<template>
  <FormProvider :form="form">
    <Field name="input" :component="[Input]" />
  </FormProvider>
</template>

<script setup>
import { createForm } from '@formivue/core'
import { FormProvider, Field } from '@formivue/vue'
import { Input } from '../../../ui'

const form = createForm()
</script>
