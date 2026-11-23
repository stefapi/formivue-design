<template>
  <FormProvider :form="form">
    <Field
      name="name"
      title="Name"
      required
      :decorator="[FormItem]"
      :component="[Input, { placeholder: 'Please Input' }]"
    />
    <FormConsumer>
      <template #default="{ form }">
        <div class="mb-4 whitespace-pre">
          {{ JSON.stringify(form.values, null, 2) }}
        </div>
        <Button
          type="primary"
          @click="
            () => {
              form.submit(log)
            }
          "
        >
          Submit
        </Button>
      </template>
    </FormConsumer>
  </FormProvider>
</template>

<script setup>
import { createForm, setValidateLanguage } from '@formivue/core'
import {
  FormProvider,
  FormConsumer,
  Field,
  connect,
  mapProps,
} from '@formivue/vue'
import { Button, FormItemBase, Input } from '../../../ui'

setValidateLanguage('en')

const FormItem = connect(
  FormItemBase,
  mapProps(
    {
      title: 'label',
      description: 'extra',
      required: true,
      validateStatus: true,
    },
    (props, field) => {
      return {
        ...props,
        help: field.selfErrors?.length ? field.selfErrors : undefined,
      }
    },
  ),
)

const form = createForm({ validateFirst: true })

const log = (...args) => {
  console.log(...args)
}
</script>
