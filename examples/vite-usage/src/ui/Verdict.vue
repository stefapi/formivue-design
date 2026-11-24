<script setup lang="ts">
import { t } from '../copy'
/** "void" component driven by x-reactions (componentProps.taux). */
const props = defineProps<{ taux?: number }>()
const level = () => {
  const rate = props.taux ?? 0
  if (!rate)
    return {
      tone: 'idle',
      title: t('Pending'),
      text: t('Enter income and rent.'),
    }
  if (rate <= 33)
    return {
      tone: 'ok',
      title: t('Solid application'),
      text: t('Effort rate of {rate}% — below the usual 33% threshold.', {
        rate,
      }),
    }
  if (rate <= 40)
    return {
      tone: 'warn',
      title: t('Needs review'),
      text: t('Effort rate of {rate}% — a guarantor is recommended.', { rate }),
    }
  return {
    tone: 'ko',
    title: t('High risk'),
    text: t('Effort rate of {rate}% — above 40%.', { rate }),
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
