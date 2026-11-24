import { DocumentValidationError } from '@formivue/json-schema'
import {
  documentError,
  documentPath,
  visitUiNodes,
  type DocumentDataPath,
} from './document-paths'
import { pathStartsWith } from './document-move'
import {
  renameDataPath,
  renameDocumentData,
  renameDocumentSchema,
  type DocumentPropertyChange,
  type DocumentPropertyRename,
} from './document-rename'
import { schemaLookup } from './document-schema'
import type {
  CompileFormDocumentOptions,
  FormDocuments,
  UiDocumentNode,
} from './documents'

export interface CanvasBindingChange {
  componentId: string
  component?: string
  kind: 'rename' | 'added' | 'removed' | 'incompatible'
  from?: DocumentDataPath
  to?: DocumentDataPath
}

export type CanvasRenameChoice = 'keep' | 'follow'

export interface VariantReconciliation {
  renames: readonly DocumentPropertyChange[]
  /** Changes to the materialized variant's own schema and data. */
  keys: readonly DocumentPropertyRename[]
}

const samePath = (a: DocumentDataPath, b: DocumentDataPath) =>
  a.length === b.length && pathStartsWith(a, b)

export function describeCanvasChanges(
  previous: FormDocuments,
  next: FormDocuments,
  options: CompileFormDocumentOptions = {},
): CanvasBindingChange[] {
  function bindings(documents: FormDocuments) {
    const lookup = schemaLookup(
      documents.dataSchema,
      options.schemaValidation?.resources,
    )
    const fields = new Map<
      string,
      { node: UiDocumentNode; path: DocumentDataPath; types: string }
    >()
    visitUiNodes(documents.ui, (node, _scope, path) => {
      if (node.kind === 'void' || node.bind === undefined) return
      const types = [...lookup.possible(lookup.at(path))].sort().join(',')
      fields.set(node.id, { node, path, types })
    })
    return fields
  }
  const before = bindings(previous)
  const after = bindings(next)
  const changes: CanvasBindingChange[] = []
  for (const [componentId, old] of before) {
    const current = after.get(componentId)
    const entry = {
      componentId,
      component: current?.node.component ?? old.node.component,
      from: old.path,
    }
    if (!current) {
      changes.push({ ...entry, kind: 'removed' })
      continue
    }
    const parent = old.path.slice(0, -1)
    const renamed = !samePath(old.path, current.path)
    if (
      old.node.kind !== current.node.kind ||
      old.node.component !== current.node.component ||
      old.types !== current.types ||
      (renamed &&
        (old.node.kind !== 'field' ||
          !samePath(parent, current.path.slice(0, -1))))
    )
      changes.push({ ...entry, kind: 'incompatible', to: current.path })
    else if (renamed)
      changes.push({ ...entry, kind: 'rename', to: current.path })
  }
  for (const [componentId, current] of after)
    if (!before.has(componentId))
      changes.push({
        componentId,
        component: current.node.component,
        kind: 'added',
        to: current.path,
      })
  return changes
}

function destination(change: DocumentPropertyChange): DocumentDataPath {
  return 'to' in change ? change.to : [...change.path.slice(0, -1), change.key]
}

// Replay the variant's path changes in the new canvas coordinates. Their
// destinations still refer to the objects and keys chosen by the variant.
export function planVariantReconciliation(
  history: readonly DocumentPropertyChange[],
  changes: readonly CanvasBindingChange[],
  choices: Readonly<Record<string, CanvasRenameChoice>> = {},
): VariantReconciliation {
  const paths = changes
    .filter(({ kind }) => kind === 'rename')
    .map((change) => ({
      change,
      previous: change.from,
      current: change.to,
    }))
  const remap = (path: DocumentDataPath) => {
    const match = paths.find(({ previous }) => pathStartsWith(path, previous))
    return match
      ? [...match.current, ...path.slice(match.previous.length)]
      : path
  }
  const renames: DocumentPropertyChange[] = []
  for (const change of history) {
    const from = remap(change.path)
    const to = remap(destination(change))
    const replay =
      'to' in change || !samePath(from.slice(0, -1), to.slice(0, -1))
        ? { path: from, to }
        : { path: from, key: to[to.length - 1] as string }
    if (!samePath(from, to)) renames.push(replay)
    for (const entry of paths) {
      entry.previous = renameDataPath(entry.previous, change)
      entry.current = renameDataPath(entry.current, replay)
    }
  }

  const keys: DocumentPropertyRename[] = []
  for (const entry of paths) {
    const { change, previous, current } = entry
    const choice = Object.prototype.hasOwnProperty.call(
      choices,
      change.componentId,
    )
      ? choices[change.componentId]
      : defaultCanvasRenameChoice(previous, change)
    const key = (choice === 'follow' ? change.to : previous).slice(
      -1,
    )[0] as string
    const desired = [...previous.slice(0, -1), key]
    if (!samePath(previous, desired)) keys.push({ path: previous, key })
    if (!samePath(current, desired)) {
      if (!samePath(current.slice(0, -1), desired.slice(0, -1)))
        documentError(
          'reconciliation_path_conflict',
          documentPath(current),
          'This field’s variant destination cannot be replayed in the new canvas',
        )
      renames.push({ path: current, key })
    }
  }
  return { keys, renames }
}

export function defaultCanvasRenameChoice(
  path: DocumentDataPath,
  change: CanvasBindingChange,
): CanvasRenameChoice {
  return samePath(path, change.from) ? 'follow' : 'keep'
}

export function materializedCanvasPath(
  change: CanvasBindingChange,
  history: readonly DocumentPropertyChange[],
) {
  return history.reduce((path, edit) => renameDataPath(path, edit), change.from)
}

export function reconcileVariantSchema(
  draft: FormDocuments['dataSchema'],
  plan: VariantReconciliation,
) {
  return plan.keys.reduce(
    (schema, change) => renameDocumentSchema(schema, change),
    draft,
  )
}

export function reconcileVariantData(
  draft: FormDocuments['data'],
  plan: VariantReconciliation,
) {
  return plan.keys.reduce(
    (data, change) => renameDocumentData(data, change),
    draft,
  )
}

export function reconciliationIssues(cause: unknown) {
  if (cause instanceof DocumentValidationError) return cause.issues
  throw cause
}
