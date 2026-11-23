// @formivue-design/vue-ui — primitives — Input / Textarea / Password
// (sur l'Input/Textarea shadcn-vue).
// Contrat form-friendly (@formivue/vue connect/mapProps) : `value` + `onChange(value)`.
import { defineComponent, h, type PropType } from 'vue'
import { UiInput, UiTextarea } from '../ui/input'
import { cn } from '../lib/utils'

const inputProps = {
  value: {
    type: [String, Number] as PropType<string | number>,
    default: undefined,
  },
  onChange: {
    type: Function as PropType<(value: string) => void>,
    default: undefined,
  },
}

export const Input = defineComponent({
  name: 'DInput',
  inheritAttrs: false,
  props: inputProps,
  setup(props, { attrs, slots }) {
    return () =>
      h(
        UiInput,
        {
          ...attrs,
          class: cn('h-8 px-2 py-1', attrs.class as string),
          value: props.value ?? '',
          onInput: (e: Event) => {
            props.onChange?.((e.target as HTMLInputElement).value)
            ;(attrs as Record<string, any>).onInput?.(e)
          },
        },
        slots,
      )
  },
})

export const Textarea = defineComponent({
  name: 'DTextarea',
  inheritAttrs: false,
  props: {
    ...inputProps,
    autoSize: {
      type: [Boolean, Object] as PropType<
        boolean | { minRows?: number; maxRows?: number }
      >,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    return () =>
      h(UiTextarea, {
        ...attrs,
        value: props.value ?? '',
        onInput: (e: Event) => {
          props.onChange?.((e.target as HTMLTextAreaElement).value)
          ;(attrs as Record<string, any>).onInput?.(e)
        },
      })
  },
})

export const Password = defineComponent({
  name: 'DPassword',
  inheritAttrs: false,
  props: inputProps,
  setup(props, { attrs }) {
    return () =>
      h(UiInput, {
        ...attrs,
        type: 'password',
        value: props.value ?? '',
        onInput: (e: Event) => {
          props.onChange?.((e.target as HTMLInputElement).value)
          ;(attrs as Record<string, any>).onInput?.(e)
        },
      })
  },
})
