// @formivue-design/vue-ui — primitives — Radio (sur le RadioGroup shadcn-vue)
// + Switch (sur le Switch shadcn-vue).
import { defineComponent, h, type PropType } from 'vue'
import { UiRadioGroup, UiRadioGroupItem } from '../ui/radio-group'
import { UiSwitch } from '../ui/switch'
import { cn } from '../lib/utils'

export interface IRadioOption {
  label: string
  value: string | number
  disabled?: boolean
  // a11y (V8, additif) : nom accessible explicite pour les options à icône
  // (un label VNode svg ne nomme pas le radio — axe button-name)
  ariaLabel?: string
}

export const Radio = defineComponent({
  name: 'DRadio',
  inheritAttrs: false,
  props: {
    options: { type: Array as PropType<IRadioOption[]>, default: () => [] },
    value: {
      type: [String, Number] as PropType<string | number>,
      default: undefined,
    },
    onChange: {
      type: Function as PropType<(value: string | number) => void>,
      default: undefined,
    },
    disabled: { type: Boolean, default: false },
    // 'button' : groupe segmenté (Radio.Button antd d'ère) — le radio reste
    // dans l'arbre a11y (sr-only), le label porte le rendu
    optionType: {
      type: String as PropType<'default' | 'button'>,
      default: 'default',
    },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit }) {
    return () => {
      const isButton = props.optionType === 'button'
      return h(
        UiRadioGroup,
        {
          ...attrs,
          modelValue: props.value,
          disabled: props.disabled,
          'onUpdate:modelValue': (v: string | number) => {
            emit('update:value', v)
            props.onChange?.(v)
          },
          class: cn(
            isButton
              ? 'flex w-full overflow-hidden rounded-md border border-input'
              : 'flex flex-wrap gap-4',
            attrs.class,
          ),
        },
        {
          default: () =>
            props.options.map((o) =>
              h(
                'label',
                {
                  key: String(o.value),
                  class: cn(
                    isButton
                      ? 'relative flex h-7 min-w-0 flex-1 cursor-pointer items-center justify-center border-l border-input px-1.5 text-[13px] text-muted-foreground transition-colors first:border-l-0 hover:text-foreground has-[[data-state=checked]]:bg-primary/10 has-[[data-state=checked]]:text-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50'
                      : 'inline-flex cursor-pointer items-center gap-2 text-sm text-foreground',
                    (o.disabled ?? false) && 'cursor-not-allowed opacity-50',
                  ),
                },
                [
                  h(UiRadioGroupItem, {
                    value: o.value,
                    disabled: o.disabled,
                    class: isButton ? 'sr-only' : undefined,
                    ...(o.ariaLabel ? { 'aria-label': o.ariaLabel } : {}),
                  }),
                  h(
                    'span',
                    { class: isButton ? 'inline-flex' : undefined },
                    o.label,
                  ),
                ],
              ),
            ),
        },
      )
    }
  },
})

export const Switch = defineComponent({
  name: 'DSwitch',
  inheritAttrs: false,
  props: {
    value: { type: Boolean, default: undefined },
    // état affiché tant que `value` est indéfinie (defaultChecked antd d'ère)
    defaultChecked: { type: Boolean, default: undefined },
    onChange: {
      type: Function as PropType<(value: boolean) => void>,
      default: undefined,
    },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit }) {
    return () =>
      h(
        UiSwitch,
        {
          ...attrs,
          modelValue: props.value ?? props.defaultChecked ?? false,
          disabled: props.disabled,
          'onUpdate:modelValue': (v: boolean) => {
            emit('update:value', v)
            props.onChange?.(v)
          },
          class: cn(
            'cursor-pointer',
            props.disabled && 'cursor-not-allowed opacity-50',
            attrs.class,
          ),
        },
        {},
      )
  },
})
