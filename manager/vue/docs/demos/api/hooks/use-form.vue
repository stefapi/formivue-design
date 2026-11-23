<template>
  <FormProvider :form="form">
    <Space>
      <Field name="input" :component="[Input]" />
      <Field name="custom" :component="[Custom]" />
    </Space>
  </FormProvider>
</template>

<script setup>
import { defineComponent, h } from 'vue'
import { createForm } from '@formivue/core'
import { FormProvider, Field, useForm } from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'
import { Input, Space } from '../../../ui'

const Custom = observer(
  defineComponent({
    setup() {
      const formRef = useForm()
      return () => {
        const form = formRef.value
        return h('div', {}, [form.values.input])
      }
    },
  }),
)

const form = createForm({ validateFirst: true })
</script>
