// @formivue-design/vue-ui — ui/slider — port TS du registry shadcn-vue :
// Slider assemblé (Root/Track/Range/Thumb, classes du registry).
import type { HTMLAttributes } from 'vue'
import { defineComponent, h } from 'vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import { cn } from '../lib/utils'

export const UiSlider = defineComponent({
  name: 'UiSlider',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
    valueText: { type: String, default: undefined },
  },
  setup(props, { attrs }) {
    return () => {
      const {
        id,
        style,
        onBlur,
        onFocus,
        'aria-label': label,
        'aria-labelledby': labelledBy,
        'aria-describedby': describedBy,
        'aria-invalid': invalid,
        'aria-valuetext': valueText,
        ...rootAttrs
      } = attrs
      return h(
        'div',
        {
          class: cn(
            'flex w-full min-w-0 items-center gap-3',
            props.class,
          ) as HTMLAttributes['class'],
          style,
        },
        [
          h(
            SliderRoot,
            {
              'data-slot': 'slider',
              ...rootAttrs,
              class:
                'relative flex h-6 min-w-0 flex-1 touch-none select-none items-center data-[disabled]:opacity-50 data-[orientation=vertical]:flex-col',
            },
            {
              default: () => [
                h(
                  SliderTrack,
                  {
                    'data-slot': 'slider-track',
                    class:
                      'bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5',
                  },
                  {
                    default: () =>
                      h(SliderRange, {
                        'data-slot': 'slider-range',
                        class:
                          'bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full',
                      }),
                  },
                ),
                h(SliderThumb, {
                  id,
                  onFocus,
                  onBlur,
                  'data-slot': 'slider-thumb',
                  'aria-label': label ?? (labelledBy ? undefined : 'slider'),
                  'aria-labelledby': labelledBy,
                  'aria-describedby': describedBy,
                  'aria-disabled': rootAttrs.disabled ? true : undefined,
                  'aria-invalid': invalid,
                  'aria-valuetext': valueText,
                  class:
                    'border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-3 focus-visible:outline-hidden disabled:pointer-events-none',
                }),
              ],
            },
          ),
          props.valueText === undefined
            ? null
            : h(
                'span',
                {
                  'data-slot': 'slider-value',
                  'aria-hidden': 'true',
                  class:
                    'text-muted-foreground min-w-8 shrink-0 text-right text-sm tabular-nums',
                },
                props.valueText,
              ),
        ],
      )
    }
  },
})
