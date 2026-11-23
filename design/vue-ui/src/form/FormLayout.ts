// @formivue-design/vue-ui — bloc form — FormLayout (provide FormLayoutKey).
import { defineComponent, h, inject, provide, type PropType } from 'vue'
import { FormLayoutKey } from './context'

export const FormLayout = defineComponent({
  name: 'DFormLayout',
  inheritAttrs: false,
  props: {
    tag: { type: String, default: undefined },
    layout: {
      type: String as PropType<'vertical' | 'horizontal'>,
      default: undefined,
    },
    labelAlign: {
      type: String as PropType<'left' | 'right'>,
      default: undefined,
    },
    labelWidth: {
      type: [Number, String] as PropType<number | string>,
      default: undefined,
    },
    size: {
      type: String as PropType<'small' | 'middle' | 'large'>,
      default: undefined,
    },
  },
  setup(props, { attrs, slots }) {
    // getters sur props (réactives) : les FormItemBase suivent les changements
    // de layout/labelAlign/… faits depuis le panneau de propriétés ; une prop
    // non renseignée (« hériter ») retombe sur le FormLayout parent, puis sur
    // le défaut (vertical / right / middle) — sémantique FormLayout antd.
    const parent = inject(FormLayoutKey, null)
    provide(FormLayoutKey, {
      get layout() {
        return props.layout ?? parent?.layout ?? 'vertical'
      },
      get labelAlign() {
        return props.labelAlign ?? parent?.labelAlign ?? 'right'
      },
      get labelWidth() {
        return props.labelWidth ?? parent?.labelWidth
      },
      get size() {
        return props.size ?? parent?.size ?? 'middle'
      },
    })
    return () => {
      const tag = props.tag ?? (parent ? 'div' : 'form')
      return h(
        tag,
        {
          ...attrs,
          class: ['text-sm', attrs.class],
          ...(tag === 'form'
            ? {
                onSubmit: (e: Event) => {
                  e.preventDefault()
                  ;(attrs as Record<string, any>).onSubmit?.(e)
                },
              }
            : {}),
        },
        slots.default?.(),
      )
    }
  },
})
