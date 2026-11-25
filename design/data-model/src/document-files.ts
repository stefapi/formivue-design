import type { FormDocuments } from '@formivue-design/formivue-transformer'

export const formDocumentFileNames = {
  ui: 'ui.json',
  dataSchema: 'data.schema.json',
  data: 'data.json',
} as const satisfies Record<keyof FormDocuments, string>

export function hasSameFormDocumentDefinition(
  previous: FormDocuments,
  next: FormDocuments,
) {
  return (
    JSON.stringify(previous.ui) === JSON.stringify(next.ui) &&
    JSON.stringify(previous.dataSchema) === JSON.stringify(next.dataSchema)
  )
}
