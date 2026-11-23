// vue-settings-form — BorderRadiusStyleSetter (port de l'ère) : le
// BoxStyleSetter habillé des icônes de coins (TopLeft/TopRight/
// BottomRight/BottomLeft).
import { defineComponent, h, type PropType } from 'vue'
import { IconWidget } from '@formivue-design/vue'
import { BoxStyleSetter } from '../BoxStyleSetter'

export interface IBorderRadiusStyleSetterProps {
  value?: string
  onChange?: (value: string) => void
}

export const BorderRadiusStyleSetter = defineComponent({
  name: 'DBorderRadiusStyleSetter',
  inheritAttrs: false,
  props: {
    value: { type: String, default: undefined },
    onChange: {
      type: null as unknown as PropType<(value: string) => void>,
      default: undefined,
    },
  },
  setup(props) {
    return () =>
      h(BoxStyleSetter as any, {
        ...props,
        labels: [
          h(IconWidget, { infer: 'TopLeft', size: 16 }),
          h(IconWidget, { infer: 'TopRight', size: 16 }),
          h(IconWidget, { infer: 'BottomRight', size: 16 }),
          h(IconWidget, { infer: 'BottomLeft', size: 16 }),
        ],
      })
  },
})
