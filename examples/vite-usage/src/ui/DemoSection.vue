<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  id: string
  index: number
  title: string
  kicker: string
  apis: string[]
  code?: string
}>()
const showCode = ref(false)
</script>

<template>
  <section :id="id" class="scroll-mt-24" :aria-labelledby="`${id}-title`">
    <div
      class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <div class="space-y-1.5">
        <p
          class="flex items-center gap-2 text-xs font-semibold tracking-widest text-indigo-600 uppercase"
        >
          <span
            class="flex size-5 items-center justify-center rounded-md bg-indigo-600 text-[11px] text-white"
          >
            {{ index }}
          </span>
          {{ kicker }}
        </p>
        <h2
          :id="`${id}-title`"
          class="text-2xl font-bold tracking-tight text-slate-900"
        >
          {{ title }}
        </h2>
        <p class="max-w-2xl text-sm leading-relaxed text-slate-600">
          <slot name="description" />
        </p>
      </div>
      <div class="flex flex-wrap gap-1.5 sm:justify-end">
        <code v-for="a in apis" :key="a" class="api-chip">{{ a }}</code>
      </div>
    </div>

    <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div class="card p-5 sm:p-6">
        <slot />
      </div>
      <aside class="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <slot name="aside" />
        <div v-if="code">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-white hover:text-slate-800"
            :aria-expanded="showCode"
            @click="showCode = !showCode"
          >
            <span>{{ showCode ? 'Hide code' : 'Show code' }}</span>
            <span aria-hidden="true">{{ showCode ? '−' : '+' }}</span>
          </button>
          <pre
            v-if="showCode"
            class="mt-1 overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-[11.5px] leading-relaxed text-slate-300 ring-1 ring-white/10"
          ><code>{{ code }}</code></pre>
        </div>
      </aside>
    </div>
  </section>
</template>
