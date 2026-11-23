// @formivue-design/vue-ui — ui/radio-group — port TS du registry shadcn-vue :
// RadioGroup.vue + RadioGroupItem.vue (dot Circle lucide).
import type { HTMLAttributes } from 'vue'
import { defineComponent, h } from 'vue'
import { Circle } from '@lucide/vue'
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from 'reka-ui'
import { cn } from '../lib/utils'

export const UiRadioGroup = defineComponent({
  name: 'UiRadioGroup',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        RadioGroupRoot,
        {
          'data-slot': 'radio-group',
          ...attrs,
          class: cn('grid gap-3', props.class) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})

export const UiRadioGroupItem = defineComponent({
  name: 'UiRadioGroupItem',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        RadioGroupItem,
        {
          'data-slot': 'radio-group-item',
          ...attrs,
          class: cn(
            'border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50',
            props.class,
          ) as HTMLAttributes['class'],
        },
        {
          default: () =>
            h(
              RadioGroupIndicator,
              {
                'data-slot': 'radio-group-indicator',
                class: 'relative flex items-center justify-center',
              },
              {
                default: () =>
                  slots.default?.() ??
                  h(Circle, {
                    class:
                      'fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2',
                  }),
              },
            ),
        },
      )
  },
})
