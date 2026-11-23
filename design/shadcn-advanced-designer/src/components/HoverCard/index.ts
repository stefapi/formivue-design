import { PanelsTopLeftIcon } from '@lucide/vue'
import { createMaterial, canvasContainer } from '../shared'
import { HoverCard as HoverCardSchema } from '../../schemas/HoverCard'
import { HoverCard as HoverCardLocales } from '../../locales/HoverCard'

export const HoverCard = createMaterial({
  name: 'HoverCard',
  icon: PanelsTopLeftIcon,
  component: canvasContainer({
    label: ['Hover Card', 'Carte au survol', 'Tarjeta al pasar el cursor'],
    heading: 'title',
    description: 'message',
    trigger: 'triggerText',
    droppable: false,
  }),
  props: {
    triggerText: 'More information',
    title: 'Details',
    message: 'Enter your contextual information',
  },
  schema: HoverCardSchema,
  locales: HoverCardLocales,
})
