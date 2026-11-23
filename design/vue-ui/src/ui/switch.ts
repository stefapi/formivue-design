// @formivue-design/vue-ui — ui/switch — port TS du registry shadcn-vue : Switch.vue.
import type { HTMLAttributes } from 'vue'
import { defineComponent, h } from 'vue'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { cn } from '../lib/utils'

export const UiSwitch = defineComponent({
  name: 'UiSwitch',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        SwitchRoot,
        {
          'data-slot': 'switch',
          ...attrs,
          class: cn(
            'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50',
            props.class,
          ) as HTMLAttributes['class'],
        },
        {
          default: (slotProps: any) =>
            h(
              SwitchThumb,
              {
                'data-slot': 'switch-thumb',
                class: cn(
                  'bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0',
                ),
              },
              { default: () => slots.thumb?.(slotProps) },
            ),
        },
      )
  },
})
