import { defineComponent, h } from 'vue'
import cls from 'classnames'
import { usePrefix } from '../../hooks'

export interface IPCSimulatorProps {
  className?: string
  style?: any
}

export const PCSimulator = defineComponent({
  name: 'PCSimulator',
  inheritAttrs: false,
  setup(_props, { slots, attrs }) {
    const prefix = usePrefix('pc-simulator')
    return () =>
      h(
        'div',
        {
          ...attrs,
          // structure d'ère (PCSimulator/styles.less) : absolute plein cadre
          class: cls(
            prefix,
            'absolute inset-0 box-border bg-background',
            (attrs as any).class,
          ),
        },
        slots.default?.(),
      )
  },
})
