<template>
  <FormProvider :form="form">
    <ObjectField name="object">
      <Custom></Custom>
    </ObjectField>
    <Custom></Custom>
    <VoidField name="void">
      <Custom></Custom>
    </VoidField>
  </FormProvider>
</template>

<script setup>
import { defineComponent, h } from 'vue'
import { createForm } from '@formivue/core'
import {
  FormProvider,
  ObjectField,
  VoidField,
  useParentForm,
} from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'

const Custom = observer(
  defineComponent({
    setup() {
      const formRef = useParentForm()
      return () => {
        const form = formRef.value
        return h('div', {}, [form.displayName])
      }
    },
  }),
)

const form = createForm()
</script>
