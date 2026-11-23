import { PanelRightIcon } from '@lucide/vue'
import { createMaterial, canvasContainer } from '../shared'
import { Sheet as SheetSchema } from '../../schemas/Sheet'
import { Sheet as SheetLocales } from '../../locales/Sheet'

export const Sheet = createMaterial({
  name: 'Sheet',
  icon: PanelRightIcon,
  component: canvasContainer({
    label: ['Sheet', 'Panneau latéral', 'Panel lateral'],
    heading: 'title',
    description: 'description',
    trigger: 'triggerText',
  }),
  droppable: true,
  props: { title: 'Sheet', triggerText: 'Open sheet' },
  schema: SheetSchema,
  locales: SheetLocales,
})
