<script setup lang="ts">
import { t } from '../copy'
/**
 * Field decorator: reads the formivue state (title, required, errors,
 * validating) — `useObserver` makes the component reactive to the
 * @formivue/reactive observables.
 */
import { useField } from '@formivue/vue'
import { useObserver } from '@formivue/reactive-vue'
import type { Field } from '@formivue/core'
import { fieldId } from './fieldId'

defineProps<{ hint?: string }>()
useObserver()
const fieldRef = useField<Field>()
</script>

<template>
  <div
    class="fi group"
    :class="{
      'fi--error': fieldRef.selfErrors?.length,
      'fi--pretty': fieldRef.pattern === 'readPretty',
    }"
  >
    <div class="mb-1.5 flex items-baseline justify-between gap-2">
      <label
        v-if="fieldRef.title"
        :for="fieldId(fieldRef)"
        class="text-[13px] font-medium text-slate-700"
      >
        {{ t(String(fieldRef.title ?? '')) }}
        <span
          v-if="fieldRef.required && fieldRef.pattern === 'editable'"
          class="text-rose-500"
          aria-hidden="true"
          >*</span
        >
      </label>
      <span
        v-if="fieldRef.validating"
        class="inline-flex items-center gap-1 text-[11px] text-indigo-500"
      >
        <span class="size-2 animate-ping rounded-full bg-indigo-400" />
        {{ t('validating…') }}
      </span>
      <span v-else-if="hint" class="text-[11px] text-slate-400">{{
        t(hint)
      }}</span>
    </div>
    <slot />
    <p
      v-if="fieldRef.selfErrors?.length"
      class="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600"
      role="alert"
    >
      <svg
        viewBox="0 0 20 20"
        class="size-3.5 shrink-0"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clip-rule="evenodd"
        />
      </svg>
      {{ t(fieldRef.selfErrors[0]) }}
    </p>
    <p
      v-else-if="fieldRef.description && fieldRef.pattern !== 'readPretty'"
      class="mt-1.5 text-xs text-slate-500"
    >
      {{ t(String(fieldRef.description ?? '')) }}
    </p>
  </div>
</template>
