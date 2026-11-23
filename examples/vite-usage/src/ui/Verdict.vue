<script setup lang="ts">
/** "void" component driven by x-reactions (componentProps.taux). */
const props = defineProps<{ taux?: number }>()
const level = () => {
  const t = props.taux ?? 0
  if (!t)
    return { tone: 'idle', title: 'Pending', text: 'Enter income and rent.' }
  if (t <= 33)
    return {
      tone: 'ok',
      title: 'Solid application',
      text: `Effort rate of ${t}% — below the usual 33% threshold.`,
    }
  if (t <= 40)
    return {
      tone: 'warn',
      title: 'Needs review',
      text: `Effort rate of ${t}% — a guarantor is recommended.`,
    }
  return {
    tone: 'ko',
    title: 'High risk',
    text: `Effort rate of ${t}% — above 40%.`,
  }
}
</script>

<template>
  <div
    class="flex items-start gap-3 rounded-xl p-4 ring-1 transition-colors"
    :class="{
      'bg-slate-50 ring-slate-200 text-slate-600': level().tone === 'idle',
      'bg-emerald-50 ring-emerald-200 text-emerald-800': level().tone === 'ok',
      'bg-amber-50 ring-amber-200 text-amber-800': level().tone === 'warn',
      'bg-rose-50 ring-rose-200 text-rose-800': level().tone === 'ko',
    }"
    aria-live="polite"
  >
    <span class="mt-0.5 text-lg leading-none" aria-hidden="true">
      {{ { idle: '…', ok: '✓', warn: '!', ko: '✕' }[level().tone] }}
    </span>
    <div>
      <p class="text-sm font-semibold">{{ level().title }}</p>
      <p class="text-[13px] opacity-90">{{ level().text }}</p>
    </div>
  </div>
</template>
