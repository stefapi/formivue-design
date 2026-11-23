<template>
  <FormProvider :form="form">
    <Field
      name="name"
      title="Name"
      required
      initialValue="Hello world"
      :decorator="[FormItem]"
      :component="[PreviewText, { placeholder: 'Please Input' }]"
    />
  </FormProvider>
</template>

<script setup>
import { defineComponent, h } from 'vue'
import { createForm, setValidateLanguage } from '@formivue/core'
import {
  FormProvider,
  Field,
  connect,
  mapProps,
  mapReadPretty,
} from '@formivue/vue'
import { FormItemBase, Input } from '../../../ui'

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

const ReadPrettyText = defineComponent({
  props: ['value'],
  setup(props) {
    return () => h('div', [props.value])
  },
})

const PreviewText = connect(Input, mapReadPretty(ReadPrettyText))

const form = createForm({ validateFirst: true, readPretty: true })
</script>
