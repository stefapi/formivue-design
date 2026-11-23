// @formivue-design/vue-ui — ui/checkbox — port TS du registry shadcn-vue :
// Checkbox.vue (reka CheckboxRoot + Indicator, icône Check lucide).
import type { HTMLAttributes } from 'vue'
import { defineComponent, h } from 'vue'
import { Check } from '@lucide/vue'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { cn } from '../lib/utils'

export const UiCheckbox = defineComponent({
  name: 'UiCheckbox',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        CheckboxRoot,
        {
          'data-slot': 'checkbox',
          ...attrs,
          class: cn(
            'peer border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50',
            props.class,
          ) as HTMLAttributes['class'],
        },
        {
          default: (slotProps: any) =>
            h(
              CheckboxIndicator,
              {
                'data-slot': 'checkbox-indicator',
                class: 'grid place-content-center text-current transition-none',
              },
              {
                default: () =>
                  slots.default?.(slotProps) ?? h(Check, { class: 'size-3.5' }),
              },
            ),
        },
      )
  },
})
