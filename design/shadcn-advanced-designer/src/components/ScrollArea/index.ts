import { ScrollTextIcon } from '@lucide/vue'
import { createMaterial, canvasContainer } from '../shared'
import { ScrollArea as ScrollAreaSchema } from '../../schemas/ScrollArea'
import { ScrollArea as ScrollAreaLocales } from '../../locales/ScrollArea'

export const ScrollArea = createMaterial({
  name: 'ScrollArea',
  icon: ScrollTextIcon,
  component: canvasContainer({
    label: ['Scroll Area', 'Zone défilante', 'Área de desplazamiento'],
    layout: 'scroll',
  }),
  droppable: true,
  props: { height: 240 },
  schema: ScrollAreaSchema,
  locales: ScrollAreaLocales,
})
