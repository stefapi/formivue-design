<script setup lang="ts">
/** Decorator for the "furnished" block: FormItem inside a highlighted panel. */
import FormItem from './FormItem.vue'
</script>

<template>
  <div
    class="animate-[fadeIn_.25s_ease-out] rounded-xl bg-indigo-50/70 p-4 ring-1 ring-indigo-100"
  >
    <p
      class="mb-3 flex items-center gap-2 text-xs font-semibold text-indigo-700"
    >
      <span
        class="rounded bg-indigo-600 px-1.5 py-0.5 font-mono text-[10px] text-white"
        >display: visible</span
      >
      Apparent because the lease is furnished — and now required.
    </p>
    <FormItem><slot /></FormItem>
  </div>
</template>

<style>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
