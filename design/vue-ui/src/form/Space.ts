// @formivue-design/vue-ui — bloc form — Space (pattern fork docs/ui/Space.vue,
// classes tokens shadcn) + Card (sur le Card shadcn-vue).
import { defineComponent, h, type PropType } from 'vue'
import {
  UiCard,
  UiCardContent,
  UiCardFooter,
  UiCardHeader,
  UiCardTitle,
} from '../ui/card'
import { cn } from '../lib/utils'

const gapClass: Record<string, string> = {
  small: 'gap-2',
  middle: 'gap-4',
  large: 'gap-6',
}

export const Space = defineComponent({
  name: 'DSpace',
  inheritAttrs: false,
  props: {
    direction: {
      type: String as PropType<'horizontal' | 'vertical'>,
      default: 'horizontal',
    },
    size: {
      type: String as PropType<'small' | 'middle' | 'large'>,
      default: 'small',
    },
    wrap: { type: Boolean, default: true },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'div',
        {
          ...attrs,
          class: [
            'flex',
            props.direction === 'vertical'
              ? 'flex-col'
              : [props.wrap && 'flex-wrap', 'items-center'],
            gapClass[props.size],
            attrs.class as string,
          ],
        },
        slots.default?.(),
      )
  },
})

export const Card = defineComponent({
  name: 'DCard',
  inheritAttrs: false,
  props: {
    title: { type: String, default: undefined },
    bordered: { type: Boolean, default: true },
    size: {
      type: String as PropType<'default' | 'small'>,
      default: 'default',
    },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        UiCard,
        {
          ...attrs,
          class: cn(
            'gap-3 py-4',
            props.size === 'small' && 'text-sm',
            props.bordered === false && 'border-0 shadow-none',
            attrs.class as string,
          ),
        },
        {
          default: () => [
            props.title || slots.title || slots.extra
              ? h(
                  UiCardHeader,
                  { class: 'mb-0 flex items-start justify-between gap-2' },
                  {
                    default: () => [
                      h(
                        UiCardTitle,
                        { class: props.size === 'small' ? 'text-sm' : '' },
                        {
                          default: () =>
                            slots.title ? slots.title() : props.title,
                        },
                      ),
                      slots.extra
                        ? h(
                            'div',
                            {
                              class:
                                'text-muted-foreground flex items-center gap-1 text-sm',
                            },
                            { default: () => slots.extra?.() },
                          )
                        : null,
                    ],
                  },
                )
              : null,
            h(
              UiCardContent,
              { class: 'px-4' },
              { default: () => slots.default?.() },
            ),
            slots.footer
              ? h(
                  UiCardFooter,
                  { class: cn('mt-2 justify-end gap-2') },
                  { default: () => slots.footer?.() },
                )
              : null,
          ],
        },
      )
  },
})
