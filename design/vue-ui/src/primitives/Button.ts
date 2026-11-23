// @formivue-design/vue-ui — primitives — Button (sur le Button shadcn-vue).
// Contrat public antd-like conservé : type default/primary/text/link,
// size small/middle/large, block — mappés sur les variants cva shadcn.
import { defineComponent, h, type PropType } from 'vue'
import { UiButton } from '../ui/button'
import { cn } from '../lib/utils'

const variantOf: Record<string, any> = {
  primary: 'default',
  default: 'outline',
  text: 'ghost',
  link: 'link',
}

const sizeOf: Record<string, any> = {
  small: 'sm',
  middle: 'default',
  large: 'lg',
}

export const Button = defineComponent({
  name: 'DButton',
  inheritAttrs: false,
  props: {
    type: {
      type: String as PropType<'default' | 'primary' | 'text' | 'link'>,
      default: 'default',
    },
    size: {
      type: String as PropType<'small' | 'middle' | 'large'>,
      default: 'middle',
    },
    block: { type: Boolean, default: false },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        UiButton,
        {
          ...attrs,
          type: (attrs.type as 'button' | 'submit' | 'reset') ?? 'button',
          variant: variantOf[props.type] ?? props.type,
          size: sizeOf[props.size] ?? props.size,
          class: cn(props.block && 'w-full', attrs.class as string),
        },
        slots,
      )
  },
})
