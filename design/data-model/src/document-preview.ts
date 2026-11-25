import { shallowRef, triggerRef } from 'vue'
import {
  createFormDocument,
  type CompileFormDocumentOptions,
  type FormDocuments,
} from '@formivue-design/formivue-transformer'
import { hasSameFormDocumentDefinition } from './document-files'

export function useDocumentPreview(options: CompileFormDocumentOptions = {}) {
  const document = shallowRef<ReturnType<typeof createFormDocument>>()

  function replace(documents?: FormDocuments, beforeReplace?: () => void) {
    const next = documents && createFormDocument(documents, options)
    try {
      beforeReplace?.()
    } catch (error) {
      next?.dispose()
      throw error
    }
    document.value?.dispose()
    document.value = next
  }

  function apply(documents: FormDocuments) {
    const current = document.value
    if (
      current &&
      hasSameFormDocumentDefinition(current.exportDocuments(), documents)
    ) {
      const { conflicts } = current.replaceData(documents.data)
      triggerRef(document)
      return conflicts
    }
    replace(documents)
  }

  return { document, apply, replace, clear: () => replace() }
}
