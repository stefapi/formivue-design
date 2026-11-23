<script setup lang="ts">
/** "KPI tile" decorator for computed fields in readPretty mode. */
import { useField } from '@formivue/vue'
import { useObserver } from '@formivue/reactive-vue'
import type { Field } from '@formivue/core'

defineProps<{ tone?: 'emerald' | 'indigo' }>()
useObserver()
const fieldRef = useField<Field>()
</script>

<template>
  <div
    class="rounded-xl p-4 ring-1"
    :class="
      tone === 'emerald'
        ? 'bg-emerald-50 ring-emerald-200/70'
        : 'bg-indigo-50 ring-indigo-200/70'
    "
  >
    <p
      class="text-[11px] font-semibold tracking-widest uppercase"
      :class="tone === 'emerald' ? 'text-emerald-700' : 'text-indigo-700'"
    >
      {{ fieldRef.title }}
    </p>
    <div class="[&_p]:text-2xl [&_p]:font-bold [&_p]:tracking-tight">
      <slot />
    </div>
  </div>
</template>
