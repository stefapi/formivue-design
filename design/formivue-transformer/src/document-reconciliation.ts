import {
  copyJson,
  DocumentValidationError,
  isJsonObject,
  jsonPointer,
  valueAt,
  type JsonValue,
} from '@formivue/json-schema'
import {
  documentError,
  documentPath,
  visitUiNodes,
  type DocumentDataPath,
} from './document-paths'
import {
  moveDocumentData,
  moveDocumentSchema,
  pathStartsWith,
} from './document-move'
import {
  renameDataPath,
  renameDocumentData,
  renameDocumentSchema,
  renameDocumentUi,
  type DocumentPropertyChange,
  type DocumentPropertyRename,
} from './document-rename'
import { schemaLookup, type DataSchema } from './document-schema'
import type {
  CompileFormDocumentOptions,
  FormDocuments,
  UiDocument,
  UiDocumentNode,
} from './documents'

export interface CanvasBindingChange {
  componentId: string
  component?: string
  kind: 'rename' | 'added' | 'removed' | 'type' | 'incompatible'
  from?: DocumentDataPath
  to?: DocumentDataPath
  fromTypes?: string[]
  toTypes?: string[]
}

export type CanvasRenameChoice = 'keep' | 'follow'
export type CanvasReconciliationChoice =
  | CanvasRenameChoice
  | 'add'
  | 'separate'
  | 'defer'
  | 'detach'
  | 'retain'
  | 'adopt'

interface CanvasNodeLocation {
  node: UiDocumentNode
  parent?: string
  index: number
}

/** A variant's explicit exceptions to the shared canvas, before path edits. */
export type CanvasNodeOverride = { id: string } & (
  { omit: true } | ({ omit?: false } & CanvasNodeLocation)
)

export const canvasReconciliationChoices = {
  rename: ['keep', 'follow'],
  added: ['add', 'separate', 'defer'],
  removed: ['detach', 'retain'],
  type: ['retain', 'adopt'],
  incompatible: ['retain', 'adopt'],
} as const satisfies Record<
  CanvasBindingChange['kind'],
  readonly CanvasReconciliationChoice[]
>

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
      { node: UiDocumentNode; path: DocumentDataPath; types: string[] }
    >()
    visitUiNodes(documents.ui, (node, _scope, path) => {
      if (node.kind === 'void' || node.bind === undefined) return
      const types = [...lookup.possible(lookup.at(path))].sort()
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
    if (renamed && !samePath(parent, current.path.slice(0, -1)))
      changes.push({ ...entry, kind: 'incompatible', to: current.path })
    else if (
      old.node.kind !== current.node.kind ||
      old.node.component !== current.node.component ||
      old.types.join(',') !== current.types.join(',')
    )
      changes.push({
        ...entry,
        kind: 'type',
        to: current.path,
        fromTypes: old.types,
        toTypes: current.types,
      })
    else if (renamed && old.node.kind !== 'field')
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
  // Reconcile a changed container once. Its decision applies to its subtree.
  return changes.filter(
    (change) =>
      !changes.some(
        (parent) =>
          parent !== change &&
          parent.kind !== 'rename' &&
          ((parent.kind !== 'added' &&
            (parent.kind !== 'removed' || change.kind === 'removed') &&
            parent.from &&
            change.from &&
            change.from.length > parent.from.length &&
            pathStartsWith(change.from, parent.from)) ||
            (parent.to &&
              change.to &&
              change.to.length > parent.to.length &&
              pathStartsWith(change.to, parent.to))),
      ),
  )
}

function destination(change: DocumentPropertyChange): DocumentDataPath {
  return 'to' in change ? change.to : [...change.path.slice(0, -1), change.key]
}

// Replay the variant's path changes in the new canvas coordinates. Their
// destinations still refer to the objects and keys chosen by the variant.
export function planVariantReconciliation(
  history: readonly DocumentPropertyChange[],
  changes: readonly CanvasBindingChange[],
  choices: Readonly<Record<string, CanvasReconciliationChoice>> = {},
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
  return history.reduce(
    (path, edit) => renameDataPath(path, edit),
    change.from ?? change.to,
  )
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

function nodeLocation(
  ui: UiDocument,
  id: string,
): (CanvasNodeLocation & { path: DocumentDataPath }) | undefined {
  let location: (CanvasNodeLocation & { path: DocumentDataPath }) | undefined
  visitUiNodes(ui, (node, _scope, path, parent) => {
    if (node.id === id)
      location = {
        node,
        path,
        parent: parent?.id,
        index: (parent?.children ?? ui.nodes).indexOf(node),
      }
  })
  return location
}

function clearChildOverrides(
  node: UiDocumentNode,
  overrides: Map<string, CanvasNodeOverride>,
) {
  const children = [...(node.children ?? []), ...(node.item ? [node.item] : [])]
  for (const child of children) {
    overrides.delete(child.id)
    clearChildOverrides(child, overrides)
  }
}

export function applyCanvasOverrides(
  ui: UiDocument,
  overrides: readonly CanvasNodeOverride[] = [],
): UiDocument {
  if (!overrides.length) return ui
  const ids = new Set(overrides.map(({ id }) => id))
  const pending = new Map(overrides.map((override) => [override.id, override]))
  function children(
    nodes: UiDocumentNode[],
    parent?: string,
  ): UiDocumentNode[] {
    const result = nodes.filter((node) => !ids.has(node.id))
    for (const [id, override] of pending) {
      if (!('node' in override) || override.parent !== parent) continue
      result.splice(Math.max(0, override.index), 0, override.node)
      pending.delete(id)
    }
    return result.map(visit)
  }
  function visit(node: UiDocumentNode): UiDocumentNode {
    const item = node.item && visit(node.item)
    const entries = children(node.children ?? [], node.id)
    return {
      ...node,
      ...(item ? { item } : {}),
      ...(entries.length || node.children ? { children: entries } : {}),
    }
  }
  const result = { ...ui, nodes: children(ui.nodes) }
  for (const override of pending.values()) {
    if (override.omit) continue
    documentError(
      'reconciliation_missing_parent',
      '/ui',
      'The previous field layout is missing. Adopt the canvas layout for this field.',
    )
  }
  return result
}

const own = (value: object, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key)

function schemaObject(
  schema: FormDocuments['dataSchema'],
  path: DocumentDataPath,
) {
  let current = schema
  for (const part of path) {
    const object = part === null ? current.items : current.properties?.[part]
    if (!isJsonObject(object))
      documentError(
        'reconciliation_schema_parent',
        documentPath(path),
        'Declare this object or array item directly in the variant schema before adding a property.',
      )
    current = object
  }
  return current
}

export function restoreAppliedProperties(
  source: Pick<FormDocuments, 'dataSchema' | 'data'>,
  applied: ReconciliationSource,
  paths: readonly { from: DocumentDataPath; to: DocumentDataPath }[],
  history: readonly DocumentPropertyChange[],
) {
  // Draft path edits extend the applied history. Replay only the unapplied edits.
  if (
    !applied.renames.every((edit, index) => {
      const next = history[index]
      return (
        next &&
        samePath(edit.path, next.path) &&
        samePath(destination(edit), destination(next))
      )
    })
  )
    return
  return restoreCanvasProperties(
    source,
    applied,
    paths.map(({ from, to }) => ({
      from: applied.renames.reduce(renameDataPath, from),
      to,
    })),
    history.slice(applied.renames.length),
  )
}

export function restoreCanvasProperties(
  source: Pick<FormDocuments, 'dataSchema' | 'data'>,
  canvas: Pick<FormDocuments, 'dataSchema' | 'data'>,
  paths: readonly { from: DocumentDataPath; to: DocumentDataPath }[],
  history: readonly DocumentPropertyChange[],
) {
  let dataSchema = source.dataSchema
  let data: FormDocuments['data'] | undefined
  const schemaPath = (path: DocumentDataPath) =>
    path.flatMap((part) => (part === null ? ['items'] : ['properties', part]))
  const canvasLookup = schemaLookup(canvas.dataSchema)

  for (const { from, to } of paths) {
    if (
      valueAt(dataSchema, schemaPath(to)) !== undefined ||
      valueAt(canvas.dataSchema, schemaPath(from)) === undefined
    )
      continue
    const current = schemaLookup(dataSchema)
    if (
      current.accepts(
        current.at(to),
        canvasLookup.possible(canvasLookup.at(from)),
      )
    )
      continue
    const missing = to.findIndex(
      (_, i) =>
        valueAt(dataSchema, schemaPath(to.slice(0, i + 1))) === undefined,
    )
    const path = to.slice(0, missing + 1)
    const parent = path.slice(0, -1)
    const targetKey = path[path.length - 1]
    if (
      !current.accepts(
        current.at(parent),
        [targetKey === null ? 'array' : 'object'],
        true,
      )
    )
      continue

    // Replay only edits to this generated property and its enclosing path.
    const key = from[0] as string
    let generatedPath = from
    let generatedSchema: FormDocuments['dataSchema'] = {
      type: 'object',
      properties: { [key]: canvas.dataSchema.properties[key] },
      ...(canvas.dataSchema.$defs ? { $defs: canvas.dataSchema.$defs } : {}),
      ...(canvas.dataSchema.required?.includes(key) ? { required: [key] } : {}),
    }
    let generatedData = own(canvas.data, key) ? { [key]: canvas.data[key] } : {}
    for (const edit of history) {
      if (
        (!pathStartsWith(edit.path, generatedPath) &&
          !pathStartsWith(generatedPath, edit.path)) ||
        schemaLookup(generatedSchema).at(edit.path) === undefined
      )
        continue
      if ('to' in edit) {
        generatedSchema = moveDocumentSchema(generatedSchema, edit).dataSchema
        generatedData = moveDocumentData(generatedData, edit)
      } else {
        generatedSchema = renameDocumentSchema(generatedSchema, edit, true)
        generatedData = renameDocumentData(generatedData, edit)
      }
      generatedPath = renameDataPath(generatedPath, edit)
    }

    const rule = valueAt(generatedSchema, schemaPath(path)) as DataSchema
    if (rule === undefined) continue
    const generated = schemaObject(generatedSchema, parent)
    if (!data) {
      dataSchema = copyJson(dataSchema) as FormDocuments['dataSchema']
      data = copyJson(source.data) as FormDocuments['data']
    }
    const target = schemaObject(dataSchema, parent)
    if (targetKey === null) {
      target.items = copyJson(rule) as DataSchema
      continue
    }
    ;(target.properties ??= {})[targetKey] = copyJson(rule) as DataSchema
    if (
      generated.required?.includes(targetKey) &&
      !target.required?.includes(targetKey)
    )
      (target.required ??= []).push(targetKey)

    if (parent.includes(null)) {
      // Each repeated record keeps its own values. Only seed a field default.
      if (isJsonObject(rule) && rule.default !== undefined)
        for (const record of dataObjects(data, parent))
          if (!own(record, targetKey))
            record[targetKey] = copyJson(rule.default)
      continue
    }
    const address = path as readonly string[]
    const value = valueAt(generatedData, address)
    if (value === undefined || valueAt(data, address) !== undefined) continue
    let record = data
    for (const part of address.slice(0, -1)) {
      if (!own(record, part)) record[part] = {}
      const child = record[part]
      if (!isJsonObject(child))
        documentError(
          'data_key_collision',
          documentPath(parent),
          'The destination is not an object in this record',
        )
      record = child
    }
    record[targetKey] = copyJson(value)
  }

  return data ? { dataSchema, data } : undefined
}

function dataObjects(
  value: JsonValue,
  path: DocumentDataPath,
): FormDocuments['data'][] {
  if (!path.length) return isJsonObject(value) ? [value] : []
  const [key, ...rest] = path
  if (key === null)
    return Array.isArray(value)
      ? value.flatMap((row) => dataObjects(row, rest))
      : []
  return isJsonObject(value) && own(value, key)
    ? dataObjects(value[key], rest)
    : []
}

function unusedKey(
  documents: Pick<FormDocuments, 'dataSchema' | 'data'>,
  parent: DocumentDataPath,
  prefix: string,
  reserved: readonly (string | null)[],
) {
  const object = schemaObject(documents.dataSchema, parent)
  const records = dataObjects(documents.data, parent)
  const taken = (key: string) =>
    reserved.includes(key) ||
    own(object.properties ?? {}, key) ||
    records.some((record) => own(record, key))
  let key = prefix
  for (let suffix = 2; taken(key); suffix++) key = prefix + '_' + suffix
  return key
}

function addSchemaProperty(
  schema: FormDocuments['dataSchema'],
  path: DocumentDataPath,
  rule: DataSchema,
  required: boolean,
) {
  const result = copyJson(schema) as FormDocuments['dataSchema']
  const object = schemaObject(result, path.slice(0, -1))
  const key = path[path.length - 1] as string
  ;(object.properties ??= {})[key] = copyJson(rule) as DataSchema
  if (required && !object.required?.includes(key))
    (object.required ??= []).push(key)
  return result
}

export function chooseCanvasAction(
  change: CanvasBindingChange,
  path: DocumentDataPath,
  choices: Readonly<Record<string, CanvasReconciliationChoice>> = {},
): CanvasReconciliationChoice {
  const available: readonly CanvasReconciliationChoice[] =
    canvasReconciliationChoices[change.kind]
  const chosen = own(choices, change.componentId) && choices[change.componentId]
  if (chosen && available.includes(chosen)) return chosen
  if (change.kind === 'rename') return defaultCanvasRenameChoice(path, change)
  return available[0]
}

type ReconciliationSource = Pick<FormDocuments, 'dataSchema' | 'data'> & {
  renames: readonly DocumentPropertyChange[]
  uiOverrides?: readonly CanvasNodeOverride[]
}

/** Replay explicit variant decisions, then validate the result as a document. */
export function migrateCanvasVariant(
  previous: UiDocument,
  canvas: FormDocuments,
  source: ReconciliationSource,
  changes: readonly CanvasBindingChange[],
  choices: Readonly<Record<string, CanvasReconciliationChoice>> = {},
  options: CompileFormDocumentOptions = {},
  canonical = false,
) {
  const oldUi = applyCanvasOverrides(previous, source.uiOverrides)
  const overrides = new Map(
    (source.uiOverrides ?? []).map((entry) => [entry.id, entry]),
  )
  const actions = changes.map((change) => ({
    change,
    choice: chooseCanvasAction(
      change,
      materializedCanvasPath(change, source.renames),
      choices,
    ),
  }))
  const insertions: {
    change: CanvasBindingChange
    choice: CanvasReconciliationChoice
  }[] = []
  const renaming: CanvasBindingChange[] = []
  for (const { change, choice } of actions) {
    const id = change.componentId
    if (change.kind === 'rename') {
      if (!overrides.has(id)) renaming.push(change)
      continue
    }
    const old = nodeLocation(oldUi, id)
    const canonicalNode = nodeLocation(previous, id)
    if (old) clearChildOverrides(old.node, overrides)
    if (canonicalNode) clearChildOverrides(canonicalNode.node, overrides)
    if (choice === 'retain') {
      if (old) {
        const { node, parent, index } = old
        overrides.set(id, { id, node, parent, index })
      } else {
        overrides.set(id, { id, omit: true })
      }
    } else if (choice === 'defer') {
      overrides.set(id, { id, omit: true })
    } else {
      overrides.delete(id)
      if (choice !== 'detach') insertions.push({ change, choice })
    }
  }

  const plan = planVariantReconciliation(source.renames, renaming, choices)
  let dataChanges: Pick<FormDocuments, 'dataSchema' | 'data'> | undefined
  if (plan.keys.length || insertions.length)
    dataChanges = {
      dataSchema: reconcileVariantSchema(source.dataSchema, plan),
      data: reconcileVariantData(source.data, plan),
    }

  const generated = schemaLookup(
    canvas.dataSchema,
    options.schemaValidation?.resources,
  )
  for (const { change, choice } of insertions) {
    const id = change.componentId
    const materialize = (path: DocumentDataPath) =>
      plan.renames.reduce(
        (address, edit) => renameDataPath(address, edit),
        path,
      )
    const canonicalParent = change.to.slice(0, -1)
    let path =
      choice === 'separate'
        ? [...materialize(canonicalParent), change.to[change.to.length - 1]]
        : materialize(change.to)
    const oldLocation = nodeLocation(oldUi, id)
    const oldPath =
      oldLocation &&
      source.renames.reduce(
        (address, edit) => renameDataPath(address, edit),
        oldLocation.path,
      )
    const parent = path.slice(0, -1)
    const key = path[path.length - 1] as string
    const object = schemaObject(dataChanges.dataSchema, parent)
    const existing = object.properties?.[key]
    const records = dataObjects(dataChanges.data, parent)
    const rule = generated.at(change.to)
    const reserved = [
      ...changes.flatMap(({ to }) => (to ? [materialize(to)] : [])),
      ...plan.renames.flatMap((edit) => [edit.path, destination(edit)]),
    ]
      .filter(
        (address) =>
          samePath(address.slice(0, -1), parent) ||
          samePath(address.slice(0, -1), canonicalParent),
      )
      .map((address) => address[address.length - 1])
    if (choice === 'separate') {
      const location = nodeLocation(canvas.ui, id)
      const replacement = unusedKey(
        dataChanges,
        parent,
        key + '_canvas',
        reserved,
      )
      const bind = location.node.bind.split('/')
      bind[bind.length - 1] = jsonPointer([replacement]).slice(1)
      overrides.set(id, {
        id,
        parent: location.parent,
        index: location.index,
        node: { ...location.node, bind: bind.join('/') },
      })
      path = [...parent, replacement]
    } else if (
      (choice === 'adopt' &&
        oldPath &&
        samePath(oldPath, path) &&
        (change.kind !== 'type' ||
          change.fromTypes.join(',') !== change.toTypes.join(','))) ||
      ((choice === 'adopt' || (canonical && choice === 'add')) &&
        existing !== undefined &&
        !generated.accepts(existing, generated.possible(rule), true))
    ) {
      if (
        existing !== undefined ||
        records.some((record) => own(record, key))
      ) {
        const archived = unusedKey(
          dataChanges,
          parent,
          key + '_previous',
          reserved,
        )
        const edit = { path, key: archived }
        dataChanges = {
          dataSchema:
            existing === undefined
              ? dataChanges.dataSchema
              : renameDocumentSchema(dataChanges.dataSchema, edit, true),
          data: renameDocumentData(dataChanges.data, edit),
        }
      }
    } else if (existing !== undefined) {
      // Keep variant constraints and values when binding an existing property.
      continue
    }
    const required = generated.constraints(generated.at(change.to.slice(0, -1)))
      .required as string[] | undefined
    const isRequired =
      required?.includes(change.to[change.to.length - 1] as string) ?? false
    dataChanges.dataSchema = addSchemaProperty(
      dataChanges.dataSchema,
      path,
      rule,
      isRequired,
    )

    const defaults = dataObjects(canvas.data, change.to.slice(0, -1))
    const ruleDefault = isJsonObject(rule)
      ? (rule.default as JsonValue | undefined)
      : undefined
    const canvasKey = change.to[change.to.length - 1] as string
    const defaultValue = change.to.includes(null)
      ? ruleDefault
      : defaults[0] && own(defaults[0], canvasKey)
        ? defaults[0][canvasKey]
        : ruleDefault
    if (defaultValue !== undefined) {
      const data = copyJson(dataChanges.data) as FormDocuments['data']
      const targetKey = path[path.length - 1] as string
      for (const record of dataObjects(data, parent))
        if (!own(record, targetKey)) record[targetKey] = copyJson(defaultValue)
      dataChanges.data = data
    }
  }
  const uiOverrides = [...overrides.values()]
  const ui = plan.renames.reduce(
    (ui, edit) => renameDocumentUi(ui, edit, options).ui,
    applyCanvasOverrides(canvas.ui, uiOverrides),
  )
  return { ui, uiOverrides, renames: plan.renames, dataChanges }
}
