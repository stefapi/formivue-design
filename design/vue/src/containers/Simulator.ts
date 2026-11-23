import { defineComponent, h } from 'vue'
import { ScreenType } from '@formivue-design/core'
import { requestIdle } from '@formivue-design/shared'
import { observer } from '@formivue/reactive-vue'
import { useScreen } from '../hooks'
import {
  MobileSimulator,
  PCSimulator,
  ResponsiveSimulator,
} from '../simulators'

export type ISimulatorProps = Record<string, any>

export const Simulator = observer(
  defineComponent({
    name: 'Simulator',
    inheritAttrs: false,
    setup(_props, { slots, attrs }) {
      const screen = useScreen()
      return () => {
        const slot = { default: () => slots.default?.() }
        const { class: className, style, ...rest } = attrs as any
        const props = {
          class: className,
          style,
          ...rest,
        }
        if (screen?.type === ScreenType.PC)
          return h(PCSimulator, props as any, slot)
        if (screen?.type === ScreenType.Mobile)
          return h(MobileSimulator, props as any, slot)
        if (screen?.type === ScreenType.Responsive)
          return h(ResponsiveSimulator, props as any, slot)
        return h(PCSimulator, props as any, slot)
      }
    },
  }),
  {
    scheduler: requestIdle,
  } as any,
)
