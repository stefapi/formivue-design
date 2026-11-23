import { GlobalRegistry } from '@formivue-design/core'
import { ChartLocaleKey } from '@formivue-design/charts-runtime'
import { observer } from '@formivue/reactive-vue'
import { defineComponent, provide, shallowRef } from 'vue'

export const ChartDesignerLocale = observer(
  defineComponent({
    name: 'ChartDesignerLocale',
    setup(_, { slots }) {
      const locale = shallowRef(GlobalRegistry.getDesignerLanguage())
      provide(ChartLocaleKey, locale)
      return () => {
        locale.value = GlobalRegistry.getDesignerLanguage()
        return slots.default?.()
      }
    },
  }),
)
