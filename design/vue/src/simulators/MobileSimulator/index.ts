import { defineComponent, h } from 'vue'
import { MobileBody } from './body'
import { usePrefix } from '../../hooks'
import cls from 'classnames'

export interface IMobileSimulatorProps {
  className?: string
  style?: any
}

export const MobileSimulator = defineComponent({
  name: 'MobileSimulator',
  inheritAttrs: false,
  setup(_props, { slots, attrs }) {
    const prefix = usePrefix('mobile-simulator')
    return () =>
      h(
        'div',
        {
          ...attrs,
          class: cls(
            prefix,
            'relative h-full min-h-[100px] w-full bg-muted',
            (attrs as any).class,
          ),
        },
        [
          h(
            'div',
            {
              class: cls(
                prefix + '-content',
                'absolute inset-0 overflow-y-auto',
              ),
            },
            [h(MobileBody, null, { default: () => slots.default?.() })],
          ),
        ],
      )
  },
})
