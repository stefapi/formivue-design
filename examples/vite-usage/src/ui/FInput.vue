<script setup lang="ts">
import { t } from '../copy'
/** Text/number control — ReactiveField contract: value + change/focus/blur. */
import { useField } from '@formivue/vue'
import { useObserver } from '@formivue/reactive-vue'
import type { Field } from '@formivue/core'
import { fieldId } from './fieldId'

const props = defineProps<{
  value?: string | number | null
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  type?: string
  suffix?: string
  format?: (v: unknown) => string
}>()
const emit = defineEmits<{
  change: [value: unknown]
  focus: [e: FocusEvent]
  blur: [e: FocusEvent]
}>()
useObserver()
const fieldRef = useField<Field>()

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  if (props.type === 'number')
    emit('change', raw === '' ? undefined : Number(raw))
  else emit('change', raw)
}
function pretty() {
  const v = props.value
  if (v === undefined || v === null || v === '') return '—'
  return props.format
    ? props.format(v)
    : `${v}${props.suffix ? ` ${props.suffix}` : ''}`
}
</script>

<template>
  <p
    v-if="fieldRef?.pattern === 'readPretty'"
    :id="fieldId(fieldRef)"
    class="py-1.5 text-sm font-medium text-slate-900"
  >
    {{ pretty() }}
  </p>
  <div v-else class="relative">
    <input
      :id="fieldId(fieldRef)"
      class="fld-input"
      :class="{ 'pr-10': suffix }"
      :type="type ?? 'text'"
      :value="value ?? ''"
      :disabled="disabled"
      :readonly="readOnly"
      :placeholder="placeholder && t(placeholder)"
      :aria-invalid="fieldRef?.selfErrors?.length ? 'true' : undefined"
      @input="onInput"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    />
    <span
      v-if="suffix"
      class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400"
      aria-hidden="true"
    >
      {{ suffix }}
    </span>
  </div>
</template>
