<script setup lang="ts">
import { t } from '../copy'
/** Dropdown fed by `field.dataSource` (formivue prop). */
import { useField } from '@formivue/vue'
import { useObserver } from '@formivue/reactive-vue'
import type { Field } from '@formivue/core'
import { fieldId } from './fieldId'

defineOptions({ inheritAttrs: false })
defineProps<{ value?: string | null; disabled?: boolean; readOnly?: boolean }>()
const emit = defineEmits<{
  change: [value: string]
  focus: [e: FocusEvent]
  blur: [e: FocusEvent]
}>()
useObserver()
const fieldRef = useField<Field>()
const options = () =>
  (fieldRef.value?.dataSource ?? []) as Array<{ label: string; value: string }>
</script>

<template>
  <p
    v-if="fieldRef?.pattern === 'readPretty'"
    :id="fieldId(fieldRef)"
    class="py-1.5 text-sm font-medium text-slate-900"
  >
    {{ t(options().find((o) => o.value === value)?.label ?? '—') }}
  </p>
  <div v-else class="relative">
    <select
      :id="fieldId(fieldRef)"
      class="fld-input appearance-none pr-9"
      v-bind="$attrs"
      :value="value ?? ''"
      :disabled="disabled || readOnly"
      @change="emit('change', ($event.target as HTMLSelectElement).value)"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    >
      <option v-for="o in options()" :key="o.value" :value="o.value">
        {{ t(o.label) }}
      </option>
    </select>
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clip-rule="evenodd"
      />
    </svg>
  </div>
</template>
