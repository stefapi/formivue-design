import VisAxis from '@unovis/vue/components/axis'
import { h } from 'vue'

export const valueAxis = (valueLabel: (value?: number) => string) =>
  h(VisAxis, {
    type: 'y',
    tickFormat: (tick: number | Date) => valueLabel(Number(tick)),
    domainLine: false,
    tickLine: false,
  })
