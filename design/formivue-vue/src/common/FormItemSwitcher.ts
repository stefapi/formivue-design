// formivue/vue — common/FormItemSwitcher (port de l'ère : Switch antd →
// Switch vue-ui, contrat value/onChange conservé).
import { defineComponent, h, type PropType } from 'vue'
import { Switch } from '@formivue-design/vue-ui'

export interface IFormItemSwitcherProps {
  value?: string
  onChange?: (value: string) => void
}

export const FormItemSwitcher = defineComponent({
  name: 'DFormItemSwitcher',
  inheritAttrs: false,
  props: {
    value: { type: String, default: undefined },
    onChange: {
      type: Function as PropType<(value: string) => void>,
      default: undefined,
    },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit }) {
    return () =>
      h(Switch, {
        ...attrs,
        value: props.value === 'FormItem',
        onChange: (value: boolean) => {
          emit('update:value', value ? 'FormItem' : undefined)
          props.onChange?.(value ? 'FormItem' : undefined)
        },
      })
  },
})
