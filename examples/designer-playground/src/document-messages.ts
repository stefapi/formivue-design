import { createDocumentMessages } from '@formivue-design/data-model/ui'
import { exampleLocale } from '../../shared/language'

export const { documentError, validationMessage } = createDocumentMessages(
  () => exampleLocale.value,
)
