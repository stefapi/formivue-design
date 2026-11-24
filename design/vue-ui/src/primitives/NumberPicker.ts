// @formivue-design/vue-ui — primitives — NumberPicker (sur le NumberField
// shadcn-vue : Increment/Decrement Plus/Minus lucide).
import { defineComponent, h, type PropType } from 'vue'
import {
  UiNumberField,
  UiNumberFieldDecrement,
  UiNumberFieldIncrement,
  UiNumberFieldInput,
} from '../ui/number-field'
import { cn } from '../lib/utils'
import { ChevronDown, ChevronUp } from '@lucide/vue'

const STEPPER =
  'static flex h-1/2 w-full translate-y-0 items-center justify-center p-0 text-muted-foreground hover:bg-accent hover:text-foreground'

export const NumberPicker = defineComponent({
  name: 'DNumberPicker',
  inheritAttrs: false,
  props: {
    value: {
      type: [Number, String] as PropType<number | string>,
      default: undefined,
    },
    onChange: {
      type: Function as PropType<(value: number | null) => void>,
      default: undefined,
    },
    min: { type: Number, default: undefined },
    max: { type: Number, default: undefined },
    step: { type: Number, default: 1 },
    precision: { type: Number, default: undefined },
    placeholder: String,
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit }) {
    return () => {
      const { onFocus, onBlur, ...rootAttrs } = attrs
      return h(
        UiNumberField,
        {
          ...rootAttrs,
          modelValue:
            typeof props.value === 'string' ? Number(props.value) : props.value,
          min: props.min,
          max: props.max,
          step: props.step,
          formatOptions: {
            maximumFractionDigits: props.precision,
            minimumFractionDigits: props.precision,
          },
          disabled: props.disabled,
          'onUpdate:modelValue': (v: number | undefined) => {
            emit('update:value', v ?? null)
            props.onChange?.(v ?? null)
          },
          class: cn('group w-full', attrs.class as string),
        },
        {
          // gabarit InputNumber antd d'ère : valeur à gauche, flèches
          // empilées à droite (révélées au survol / focus)
          default: () => [
            h(UiNumberFieldInput, {
              class: 'h-8 pl-2 pr-7 text-left',
              placeholder: props.placeholder,
              onFocus,
              onBlur,
            }),
            h(
              'div',
              {
                class:
                  'absolute inset-y-px right-px flex w-5 flex-col overflow-hidden rounded-r-md border-l border-input opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100',
              },
              [
                h(
                  UiNumberFieldIncrement,
                  { 'aria-label': 'increase', class: STEPPER },
                  { default: () => h(ChevronUp, { class: 'size-3' }) },
                ),
                h(
                  UiNumberFieldDecrement,
                  {
                    'aria-label': 'decrease',
                    class: cn(STEPPER, 'border-t border-input'),
                  },
                  { default: () => h(ChevronDown, { class: 'size-3' }) },
                ),
              ],
            ),
          ],
        },
      )
    }
  },
})
