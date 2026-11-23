import { PanelBottomIcon } from '@lucide/vue'
import { createMaterial, canvasContainer } from '../shared'
import { Drawer as DrawerSchema } from '../../schemas/Drawer'
import { Drawer as DrawerLocales } from '../../locales/Drawer'

export const Drawer = createMaterial({
  name: 'Drawer',
  icon: PanelBottomIcon,
  component: canvasContainer({
    label: ['Drawer', 'Tiroir', 'Cajón'],
    heading: 'title',
    description: 'description',
    trigger: 'triggerText',
  }),
  droppable: true,
  props: { title: 'Drawer', triggerText: 'Open drawer' },
  schema: DrawerSchema,
  locales: DrawerLocales,
})
