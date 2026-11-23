<template>
  <FormProvider :form="form">
    <SchemaField :schema="schema" />
  </FormProvider>
</template>

<script setup>
import { defineComponent, h } from 'vue'
import { createForm } from '@formivue/core'
import { FormProvider, createSchemaField } from '@formivue/vue'
import { Input } from '../../ui'

const UserIcon = defineComponent({
  name: 'UserIcon',
  setup() {
    return () =>
      h(
        'svg',
        {
          class: 'size-4 text-gray-400',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '2',
        },
        [
          h('path', {
            d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
          }),
        ],
      )
  },
})

const { SchemaField } = createSchemaField({
  components: {
    Input,
  },
})

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      'x-component': 'Input',
      'x-content': {
        prefix: UserIcon,
      },
    },
  },
}

const form = createForm()
</script>
