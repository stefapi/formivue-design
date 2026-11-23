// @formivue-design/vue-ui — ui/card + ui/label — ports TS du registry shadcn-vue.
import type { HTMLAttributes } from 'vue'
import { defineComponent, h } from 'vue'
import { Label } from 'reka-ui'
import { cn } from '../lib/utils'

export const UiCard = defineComponent({
  name: 'UiCard',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'div',
        {
          'data-slot': 'card',
          ...attrs,
          class: cn(
            'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
            props.class,
          ) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})

export const UiCardHeader = defineComponent({
  name: 'UiCardHeader',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'div',
        {
          'data-slot': 'card-header',
          ...attrs,
          class: cn(
            'grid auto-rows-min items-start gap-1.5 px-6',
            props.class,
          ) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})

export const UiCardTitle = defineComponent({
  name: 'UiCardTitle',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'div',
        {
          'data-slot': 'card-title',
          ...attrs,
          class: cn(
            'text-base leading-none font-semibold',
            props.class,
          ) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})

export const UiCardContent = defineComponent({
  name: 'UiCardContent',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'div',
        {
          'data-slot': 'card-content',
          ...attrs,
          class: cn('px-6', props.class) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})

export const UiCardFooter = defineComponent({
  name: 'UiCardFooter',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'div',
        {
          'data-slot': 'card-footer',
          ...attrs,
          class: cn(
            'flex items-center px-6',
            props.class,
          ) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})

export const UiLabel = defineComponent({
  name: 'UiLabel',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        Label,
        {
          'data-slot': 'label',
          ...attrs,
          class: cn(
            'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            props.class,
          ) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})
