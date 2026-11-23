<script setup lang="ts">
/** reka-ui switch driven by formivue. */
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { useField } from '@formivue/vue'
import { useObserver } from '@formivue/reactive-vue'
import type { Field } from '@formivue/core'
import { fieldId } from './fieldId'

defineProps<{
  value?: boolean
  disabled?: boolean
  readOnly?: boolean
  label?: string
}>()
const emit = defineEmits<{ change: [value: boolean] }>()
useObserver()
const fieldRef = useField<Field>()
</script>

<template>
  <p
    v-if="fieldRef?.pattern === 'readPretty'"
    :id="fieldId(fieldRef)"
    class="py-1.5 text-sm font-medium text-slate-900"
  >
    {{ value ? 'Yes' : 'No' }}
  </p>
  <div v-else class="flex items-center gap-3 py-1">
    <SwitchRoot
      :id="fieldId(fieldRef)"
      :model-value="!!value"
      :disabled="disabled || readOnly"
      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-slate-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-indigo-600"
      @update:model-value="emit('change', $event)"
    >
      <SwitchThumb
        class="block size-5 translate-x-0.5 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-[22px]"
      />
    </SwitchRoot>
    <span v-if="label" class="text-sm text-slate-600" aria-hidden="true">{{
      label
    }}</span>
  </div>
</template>
