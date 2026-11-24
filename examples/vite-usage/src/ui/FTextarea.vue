<script setup lang="ts">
import { t } from '../copy'
import { useField } from '@formivue/vue'
import { useObserver } from '@formivue/reactive-vue'
import type { Field } from '@formivue/core'
import { fieldId } from './fieldId'

defineProps<{
  value?: string | null
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
}>()
const emit = defineEmits<{
  change: [value: string]
  focus: [e: FocusEvent]
  blur: [e: FocusEvent]
}>()
useObserver()
const fieldRef = useField<Field>()
</script>

<template>
  <p
    v-if="fieldRef?.pattern === 'readPretty'"
    :id="fieldId(fieldRef)"
    class="py-1.5 text-sm whitespace-pre-line text-slate-900"
  >
    {{ value || '—' }}
  </p>
  <textarea
    v-else
    :id="fieldId(fieldRef)"
    class="fld-input min-h-24 resize-y"
    rows="3"
    :value="value ?? ''"
    :disabled="disabled"
    :readonly="readOnly"
    :placeholder="placeholder && t(placeholder)"
    @input="emit('change', ($event.target as HTMLTextAreaElement).value)"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  />
</template>
