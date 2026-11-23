<template>
  <FormProvider :form="form">
    <Space direction="vertical">
      <Field
        name="name"
        title="Name"
        required
        :component="[Input, { placeholder: 'Please Input' }]"
      />
      <FormPreviewer />
    </Space>
  </FormProvider>
</template>

<script setup>
import { defineComponent, h } from 'vue'
import { createForm } from '@formivue/core'
import { FormProvider, Field, useForm } from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'
import { Input, Space } from '../../../ui'

const FormPreviewer = observer(
  defineComponent({
    name: 'FormPreviewer',
    setup() {
      const formRef = useForm()
      return () => {
        const form = formRef.value
        return h('div', [JSON.stringify(form.values)])
      }
    },
  }),
)

const form = createForm({ validateFirst: true })
</script>
