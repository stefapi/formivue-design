import { defineComponent } from 'vue'
import { DefineComponent } from '../types'

export const Fragment = '#fragment'

export const FragmentComponent = defineComponent({
  name: 'Fragment',
  render() {
    return this.$slots.default?.()
  },
}) as unknown as DefineComponent<{}>
