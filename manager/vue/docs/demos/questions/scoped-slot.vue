<template>
  <FormProvider :form="form">
    <SchemaField :schema="schema" />
  </FormProvider>
</template>

<script setup>
import { defineComponent, h } from 'vue'
import { createForm } from '@formivue/core'
import { FormProvider, createSchemaField } from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'

// A plain component with scoped slots
const TextPreviewer = defineComponent({
  name: 'TextPreviewer',
  setup(_, { slots }) {
    return () =>
      h('div', [
        slots.default?.({
          slotProp: 'Slot prop value of the default scoped-slot component',
          onScopedFunc: ($event) => {
            alert($event)
          },
        }),
      ])
  },
})

// Reactive component
const ObservedComponent = observer(
  defineComponent({
    setup(_, { slots }) {
      return () => h(TextPreviewer, {}, slots)
    },
  }),
)

// Scoped-slot component
const ScopedSlotComponent = (_props, { attrs }) => {
  return h(
    'div',
    {
      onClick: () => {
        attrs.onScopedFunc(
          'Event function passed through the scoped slot, value is passed back after the event',
        )
      },
    },
    [attrs.slotProp],
  )
}

const { SchemaField } = createSchemaField({
  components: {
    ObservedComponent,
  },
})

const schema = {
  type: 'object',
  properties: {
    textPreview: {
      type: 'string',
      'x-component': 'ObservedComponent',
      'x-content': {
        default: ScopedSlotComponent,
      },
    },
  },
}

const form = createForm()
</script>
