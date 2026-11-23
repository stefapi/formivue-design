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
import { defineComponent, h } from 'vue'
import { createForm, setValidateLanguage } from '@formivue/core'
import { FormProvider, FormConsumer, Field, useField } from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'
import { Button, FormItemBase, Input } from '../../../ui'

setValidateLanguage('en')

const FormItem = observer(
  defineComponent({
    setup(props, { slots }) {
      const fieldRef = useField()
      return () => {
        const field = fieldRef.value
        return h(
          FormItemBase,
          {
            label: field.title,
            required: field.required,
            help: field.selfErrors?.length ? field.selfErrors : undefined,
            extra: field.description,
            validateStatus: field.validateStatus,
          },
          slots,
        )
      }
    },
  }),
)

const form = createForm({ validateFirst: true })

const log = (...args) => {
  console.log(...args)
}
</script>
