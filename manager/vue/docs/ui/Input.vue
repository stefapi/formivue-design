<script setup lang="ts">
import { FieldControl, FieldRoot } from 'reka-ui'

defineOptions({ name: 'FormivueInput', inheritAttrs: false })

const props = defineProps<{
  value?: string | number
  onChange?: (value: string) => void
}>()

const handleChange = (value: string) => props.onChange?.(value)
</script>

<template>
  <FieldRoot as-child>
    <div
      class="flex w-full items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 shadow-xs transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30 dark:border-gray-600"
    >
      <slot name="prefix" />
      <FieldControl
        v-bind="$attrs"
        :model-value="value"
        class="w-full border-none bg-transparent p-0 text-sm shadow-none outline-none placeholder:text-gray-400 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-100"
        @update:model-value="handleChange"
      />
      <slot />
    </div>
  </FieldRoot>
</template>
