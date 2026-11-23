import { ListChecksIcon } from '@lucide/vue'
import { createMaterial, materialNode, canvasContainer } from '../shared'
import { Questionnaire as QuestionnaireSchema } from '../../schemas/Questionnaire'
import { Questionnaire as QuestionnaireLocales } from '../../locales/Questionnaire'
import { QuestionnaireStep as QuestionnaireStepSchema } from '../../schemas/QuestionnaireStep'
import { QuestionnaireStep as QuestionnaireStepLocales } from '../../locales/QuestionnaireStep'

export const Questionnaire = createMaterial({
  name: 'Questionnaire',
  icon: ListChecksIcon,
  component: canvasContainer({
    label: ['Questionnaire', 'Questionnaire', 'Cuestionario'],
    child: {
      name: 'QuestionnaireStep',
      label: ['Question', 'Question', 'Pregunta'],
    },
  }),
  child: 'QuestionnaireStep',
  children: [materialNode('QuestionnaireStep', { title: 'Question 1' })],
  schema: QuestionnaireSchema,
  locales: QuestionnaireLocales,
})

export const QuestionnaireStep = createMaterial({
  name: 'QuestionnaireStep',
  parent: 'Questionnaire',
  component: canvasContainer({
    label: ['Question', 'Question', 'Pregunta'],
    heading: 'title',
    description: 'description',
  }),
  droppable: true,
  schema: QuestionnaireStepSchema,
  locales: QuestionnaireStepLocales,
})
