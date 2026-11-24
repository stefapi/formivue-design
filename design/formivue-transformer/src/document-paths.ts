import {
  DocumentValidationError,
  isJsonObject,
  jsonPointer,
  pointerSegments,
} from '@formivue/json-schema'
import type { UiDocument, UiDocumentNode } from './documents'

/** A null segment denotes every item of a repeated array. */
export type DocumentDataPath = readonly (string | null)[]

export const documentPath = (path: DocumentDataPath) =>
  jsonPointer(path.map((part) => part ?? '*'))

export function documentError(
  code: string,
  path: string,
  message: string,
): never {
  throw new DocumentValidationError([
    { code, path, message, severity: 'error' },
  ])
}

export function visitUiNodes(
  ui: UiDocument,
  visit: (
    node: UiDocumentNode,
    scope: DocumentDataPath,
    path: DocumentDataPath,
    parent?: UiDocumentNode,
  ) => void,
) {
  if (!isJsonObject(ui) || ui.version !== 1 || !Array.isArray(ui.nodes))
    documentError(
      'invalid_ui_document',
      '/ui',
      'Expected a version 1 UI document',
    )

  function walk(
    node: UiDocumentNode,
    scope: DocumentDataPath,
    isItem = false,
    parent?: UiDocumentNode,
  ) {
    if (
      !isJsonObject(node) ||
      !['field', 'array', 'object', 'void'].includes(node.kind)
    )
      documentError('invalid_ui_node', documentPath(scope), 'Invalid UI node')
    if (node.children !== undefined && !Array.isArray(node.children))
      documentError(
        'invalid_ui_node',
        documentPath(scope),
        'Expected an array of UI children',
      )
    const bind =
      !isItem && node.kind !== 'void' ? pointerSegments(node.bind) : []
    const path = [...scope, ...bind]
    visit(node, scope, path, parent)
    node.children?.forEach((child) => walk(child, path, false, node))
    if (node.item) walk(node.item, [...path, null], true, node)
  }

  ui.nodes.forEach((node) => walk(node, []))
}
