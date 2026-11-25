import { createDocumentMessages } from '@formivue-design/data-model/ui'
import { exampleLocale } from '../../shared/language'

export const { conflictMessage, documentError, validationMessage } =
  createDocumentMessages(() => exampleLocale.value)
