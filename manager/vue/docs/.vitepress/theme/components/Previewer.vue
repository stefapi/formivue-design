<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'

const props = defineProps({
  demoPath: { type: String, required: true },
})

const demoComponents = import.meta.glob('../../../demos/**/*.vue')
const demoSources = import.meta.glob('../../../demos/**/*.vue', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const key = computed(() => `../../../demos/${props.demoPath}.vue`)

const DemoComponent = defineAsyncComponent(demoComponents[key.value])

const source = ref('')
onMounted(() => {
  source.value = demoSources[key.value] as string
})

const showSource = ref(false)
</script>

<template>
  <div class="preview-stage">
    <ClientOnly>
      <DemoComponent />
      <template #fallback>
        <p>loading...</p>
      </template>
    </ClientOnly>
  </div>
  <div v-if="source">
    <button
      class="mb-2 rounded-md border border-solid px-3 py-1 text-sm"
      :class="
        showSource
          ? 'border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800'
          : 'border-[var(--vp-c-brand)] text-[var(--vp-c-brand)]'
      "
      @click="showSource = !showSource"
    >
      {{ showSource ? 'Hide code' : 'View code' }}
    </button>
    <div v-if="showSource" class="preview-source">
      <pre><code>{{ source }}</code></pre>
    </div>
  </div>
</template>
