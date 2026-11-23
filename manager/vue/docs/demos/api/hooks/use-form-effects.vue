<template>
  <FormProvider :form="form">
    <Field
      name="input"
      :decorator="[FormItem]"
      :component="[Input, { placeholder: 'input' }]"
    />
    <Field name="custom" :decorator="[FormItem]" :component="[Custom]" />
  </FormProvider>
</template>

<script setup>
import { defineComponent, h } from 'vue'
import { createForm, onFieldReact } from '@formivue/core'
import { FormProvider, Field, useFormEffects } from '@formivue/vue'
import { FormItem, Input } from '../../../ui'

const Custom = defineComponent({
  setup() {
    useFormEffects(() => {
      onFieldReact('custom.bb', (field) => {
        field.value = field.query('.aa').get('value')
      })
    })
    return () =>
      h('div', {}, [
        h(Field, {
          name: 'aa',
          decorator: [FormItem],
          component: [Input, { placeholder: 'aa' }],
        }),
        h(Field, {
          name: 'bb',
          decorator: [FormItem],
          component: [Input, { placeholder: 'bb' }],
        }),
      ])
  },
})

const form = createForm({
  effects() {
    onFieldReact('custom.aa', (field) => {
      field.value = field.query('input').get('value')
    })
  },
})
</script>
