<script setup lang="ts">
defineOptions({ name: 'FormItemBase', inheritAttrs: false })

defineProps<{
  label?: string
  help?: string | string[]
  extra?: string
  required?: boolean
  validateStatus?: boolean
}>()
</script>

<template>
  <div class="mb-4">
    <label
      v-if="label"
      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <slot />
    <p v-if="help" class="mt-1 text-xs text-red-500">
      {{ Array.isArray(help) ? help.join(' ') : help }}
    </p>
    <p v-else-if="extra" class="mt-1 text-xs text-gray-400 dark:text-gray-500">
      {{ extra }}
    </p>
  </div>
</template>
