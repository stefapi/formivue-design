<script setup lang="ts">
/**
 * Live formivue state inspector: reads the form observables
 * (values, errors, valid, modified, pattern) — automatic re-render via
 * `useObserver`, no Vue glue.
 */
import { ref } from 'vue'
import { toJS } from '@formivue/reactive'
import { useObserver } from '@formivue/reactive-vue'
import type { Form } from '@formivue/core'

const props = defineProps<{ form: Form; log?: string[]; title?: string }>()
useObserver()
const tab = ref<'values' | 'errors' | 'log'>('values')

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function highlight(value: unknown) {
  const json = esc(JSON.stringify(value, null, 2) ?? 'undefined')
  return json.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g,
    (m, str, colon, kw, num) => {
      if (str)
        return colon
          ? `<span class="text-sky-300">${str}</span>${colon}`
          : `<span class="text-emerald-300">${str}</span>`
      if (kw) return `<span class="text-violet-300">${kw}</span>`
      if (num) return `<span class="text-amber-300">${num}</span>`
      return m
    },
  )
}
const errors = () =>
  props.form.errors.map((e) => ({
    path: String(e.address ?? e.path),
    messages: e.messages ?? [],
  }))
</script>

<template>
  <div
    class="overflow-hidden rounded-xl bg-slate-950 text-slate-300 shadow-xl ring-1 ring-white/10"
  >
    <div
      class="flex items-center justify-between border-b border-white/10 px-4 py-2.5"
    >
      <div class="flex items-center gap-2">
        <span
          class="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/70"
        />
        <span class="font-mono text-[11px] tracking-wide text-slate-400">
          {{ title ?? 'form' }} · live state
        </span>
      </div>
      <div class="flex gap-1">
        <span
          class="rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
          :class="
            form.valid
              ? 'bg-emerald-500/15 text-emerald-300'
              : 'bg-rose-500/15 text-rose-300'
          "
        >
          {{ form.valid ? 'valid' : 'invalid' }}
        </span>
        <span
          class="rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
          :class="
            form.modified
              ? 'bg-amber-500/15 text-amber-300'
              : 'bg-white/5 text-slate-500'
          "
        >
          {{ form.modified ? 'modified' : 'pristine' }}
        </span>
      </div>
    </div>

    <div
      class="flex gap-1 border-b border-white/10 px-2 pt-2"
      role="tablist"
      aria-label="State view"
    >
      <button
        v-for="t in log
          ? (['values', 'errors', 'log'] as const)
          : (['values', 'errors'] as const)"
        :key="t"
        type="button"
        role="tab"
        :aria-selected="tab === t"
        class="rounded-t-md px-3 py-1.5 font-mono text-[11px] transition"
        :class="
          tab === t
            ? 'bg-white/10 text-white'
            : 'text-slate-500 hover:text-slate-300'
        "
        @click="tab = t"
      >
        {{
          t === 'values'
            ? 'values'
            : t === 'errors'
              ? `errors (${form.errors.length})`
              : `effects (${log?.length ?? 0})`
        }}
      </button>
    </div>

    <div
      class="max-h-80 min-h-44 overflow-auto p-4 font-mono text-[12px] leading-relaxed"
    >
      <pre
        v-if="tab === 'values'"
        class="whitespace-pre-wrap"
        v-html="highlight(toJS(form.values))"
      />
      <template v-else-if="tab === 'errors'">
        <p v-if="!form.errors.length" class="text-emerald-300/80">
          ✓ no errors
        </p>
        <ul v-else class="space-y-2">
          <li v-for="e in errors()" :key="e.path">
            <span class="text-sky-300">{{ e.path }}</span>
            <span class="text-slate-600"> → </span>
            <span class="text-rose-300">{{ e.messages.join(', ') }}</span>
          </li>
        </ul>
      </template>
      <template v-else>
        <p v-if="!log?.length" class="text-slate-500">
          Type a value to see the effects…
        </p>
        <ol v-else class="space-y-1">
          <li
            v-for="(l, i) in log"
            :key="i"
            class="truncate"
            :class="i === 0 ? 'text-white' : 'text-slate-500'"
          >
            {{ l }}
          </li>
        </ol>
      </template>
    </div>
  </div>
</template>
