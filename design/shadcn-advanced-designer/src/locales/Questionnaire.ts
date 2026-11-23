import { materialLocales } from './shared'

export const Questionnaire = materialLocales(
  ['Questionnaire', 'Questionnaire', 'Cuestionario'],
  {
    label: ['Accessible label', 'Libellé accessible', 'Etiqueta accesible'],
    previousText: ['Previous button', 'Bouton Précédent', 'Botón Anterior'],
    nextText: ['Next button', 'Bouton Suivant', 'Botón Siguiente'],
    initialStep: [
      'First step ID',
      'Identifiant de la première étape',
      'ID del primer paso',
    ],
    finishText: ['Finish button', 'Bouton Terminer', 'Botón Finalizar'],
    completedText: [
      'Completion message',
      'Message de fin',
      'Mensaje de finalización',
    ],
    validationText: [
      'Validation message',
      'Message de validation',
      'Mensaje de validación',
    ],
    onSubmit: [
      'Submission expression',
      'Expression de soumission',
      'Expresión de envío',
    ],
  },
)
