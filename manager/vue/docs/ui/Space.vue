<script setup lang="ts">
defineOptions({ name: 'FormivueSpace', inheritAttrs: false })

withDefaults(
  defineProps<{
    direction?: 'horizontal' | 'vertical'
    size?: 'small' | 'middle' | 'large'
  }>(),
  { direction: 'horizontal', size: 'small' },
)

const gapClass: Record<string, string> = {
  small: 'gap-2',
  middle: 'gap-4',
  large: 'gap-6',
}
</script>

<template>
  <div
    v-bind="$attrs"
    class="flex"
    :class="[
      direction === 'vertical' ? 'flex-col' : 'flex-wrap items-center',
      gapClass[size],
    ]"
  >
    <slot />
  </div>
</template>
