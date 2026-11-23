// @formivue-design/vue-ui — ui/number-field — port TS du registry shadcn-vue :
// NumberField (Root/Input/Increment/Decrement, icônes Plus/Minus lucide).
import type { HTMLAttributes } from 'vue'
import { defineComponent, h } from 'vue'
import { Minus, Plus } from '@lucide/vue'
import {
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldRoot,
} from 'reka-ui'
import { cn } from '../lib/utils'

export const UiNumberField = defineComponent({
  name: 'UiNumberField',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        NumberFieldRoot,
        {
          'data-slot': 'number-field',
          ...attrs,
          class: cn(
            'relative flex items-center select-none',
            props.class,
          ) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})

export const UiNumberFieldContent = defineComponent({
  name: 'UiNumberFieldContent',
  setup(_props, { slots }) {
    return () =>
      h(
        'div',
        { 'data-slot': 'number-field-content', class: 'relative' },
        slots.default?.(),
      )
  },
})

export const UiNumberFieldInput = defineComponent({
  name: 'UiNumberFieldInput',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs }) {
    return () =>
      h(NumberFieldInput, {
        'data-slot': 'number-field-input',
        ...attrs,
        class: cn(
          'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-center text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50',
          props.class,
        ) as HTMLAttributes['class'],
      })
  },
})

const stepperClasses =
  'absolute top-1/2 -translate-y-1/2 disabled:cursor-not-allowed disabled:opacity-20 p-3'

export const UiNumberFieldIncrement = defineComponent({
  name: 'UiNumberFieldIncrement',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        NumberFieldIncrement,
        {
          'data-slot': 'number-field-increment',
          ...attrs,
          class: cn('right-0', stepperClasses, props.class) as any,
        },
        { default: () => slots.default?.() ?? h(Plus, { class: 'h-4 w-4' }) },
      )
  },
})

export const UiNumberFieldDecrement = defineComponent({
  name: 'UiNumberFieldDecrement',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        NumberFieldDecrement,
        {
          'data-slot': 'number-field-decrement',
          ...attrs,
          class: cn('left-0', stepperClasses, props.class) as any,
        },
        { default: () => slots.default?.() ?? h(Minus, { class: 'h-4 w-4' }) },
      )
  },
})
