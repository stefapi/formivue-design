import { defineComponent, h } from 'vue'
import { IconWidget } from '@formivue-design/vue'

export const LogoWidget = defineComponent({
  name: 'LogoWidget',
  setup() {
    return () =>
      h(IconWidget, {
        infer: 'Logo',
        role: 'img',
        'aria-label': 'Formivue',
        style: { margin: '4px 8px', height: '30px', width: '121px' },
      })
  },
})
