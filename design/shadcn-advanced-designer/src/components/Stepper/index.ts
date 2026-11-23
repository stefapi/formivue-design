import { ListOrderedIcon } from '@lucide/vue'
import { createMaterial, materialNode, canvasContainer } from '../shared'
import { Stepper as StepperSchema } from '../../schemas/Stepper'
import { Stepper as StepperLocales } from '../../locales/Stepper'
import { StepperStep as StepperStepSchema } from '../../schemas/StepperStep'
import { StepperStep as StepperStepLocales } from '../../locales/StepperStep'

export const Stepper = createMaterial({
  name: 'Stepper',
  icon: ListOrderedIcon,
  component: canvasContainer({
    label: ['Stepper', 'Parcours par étapes', 'Navegación por pasos'],
    child: { name: 'StepperStep', label: ['Step', 'Étape', 'Paso'] },
  }),
  child: 'StepperStep',
  children: [materialNode('StepperStep', { title: 'Step 1' })],
  schema: StepperSchema,
  locales: StepperLocales,
})

export const StepperStep = createMaterial({
  name: 'StepperStep',
  parent: 'Stepper',
  component: canvasContainer({
    label: ['Step', 'Étape', 'Paso'],
    heading: 'title',
    description: 'description',
  }),
  droppable: true,
  schema: StepperStepSchema,
  locales: StepperStepLocales,
})
