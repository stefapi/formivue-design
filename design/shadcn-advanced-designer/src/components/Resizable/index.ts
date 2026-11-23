import { PanelsLeftBottomIcon } from '@lucide/vue'
import { createMaterial, materialNode, canvasContainer } from '../shared'
import { Resizable as ResizableSchema } from '../../schemas/Resizable'
import { Resizable as ResizableLocales } from '../../locales/Resizable'
import { ResizablePanel as ResizablePanelSchema } from '../../schemas/ResizablePanel'
import { ResizablePanel as ResizablePanelLocales } from '../../locales/ResizablePanel'

export const Resizable = createMaterial({
  name: 'Resizable',
  icon: PanelsLeftBottomIcon,
  component: canvasContainer({
    label: [
      'Resizable',
      'Panneaux redimensionnables',
      'Paneles redimensionables',
    ],
    child: { name: 'ResizablePanel', label: ['Panel', 'Panneau', 'Panel'] },
    layout: 'split',
  }),
  props: { direction: 'horizontal', height: 320 },
  child: 'ResizablePanel',
  children: [
    materialNode('ResizablePanel', { title: 'Panel 1' }),
    materialNode('ResizablePanel', { title: 'Panel 2' }),
  ],
  schema: ResizableSchema,
  locales: ResizableLocales,
})

export const ResizablePanel = createMaterial({
  name: 'ResizablePanel',
  parent: 'Resizable',
  component: canvasContainer({
    label: ['Panel', 'Panneau', 'Panel'],
    heading: 'title',
  }),
  droppable: true,
  schema: ResizablePanelSchema,
  locales: ResizablePanelLocales,
})
