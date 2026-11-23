// @formivue-design/vue — icons/add.ts — port mécanique de l'ère (svgr → composants Vue h()).
import { h } from 'vue'

export const Add = (p?: any) =>
  h(
    'svg',
    {
      ...{ viewBox: '64 64 896 896' },
      focusable: 'false',
      'aria-hidden': 'true',
      ...p,
    },
    [
      h('path', {
        d: 'M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z',
      }),
      h('path', {
        d: 'M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z',
      }),
    ],
  )
