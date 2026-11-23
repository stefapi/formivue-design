<script setup lang="ts">
defineOptions({ name: 'FormivueButton', inheritAttrs: false })

withDefaults(
  defineProps<{
    type?: 'primary' | 'default'
  }>(),
  { type: 'default' },
)
</script>

<template>
  <button
    v-bind="$attrs"
    class="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    :class="
      type === 'primary'
        ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
        : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800'
    "
  >
    <slot />
  </button>
</template>
