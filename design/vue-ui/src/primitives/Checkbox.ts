// @formivue-design/vue-ui — primitives — Checkbox (sur le Checkbox shadcn-vue :
// reka-ui CheckboxRoot + icône Check lucide).
import { defineComponent, h, type PropType } from 'vue'
import { UiCheckbox } from '../ui/checkbox'
import { cn } from '../lib/utils'

export const Checkbox = defineComponent({
  name: 'DCheckbox',
  inheritAttrs: false,
  props: {
    value: { type: Boolean, default: undefined },
    onChange: {
      type: Function as PropType<(value: boolean) => void>,
      default: undefined,
    },
    label: { type: String, default: undefined },
  },
  emits: ['update:value'],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        'label',
        {
          ...attrs,
          class: cn(
            'inline-flex cursor-pointer items-center gap-2 text-sm text-foreground',
            attrs.class as string,
          ),
        },
        [
          h(
            UiCheckbox,
            {
              modelValue: props.value ?? false,
              'onUpdate:modelValue': (v: boolean) => {
                emit('update:value', v)
                props.onChange?.(v)
              },
            },
            {
              // slot default de UiCheckbox = icône Check (registry)
            },
          ),
          h('span', {}, slots.default?.() ?? props.label),
        ],
      )
  },
})
