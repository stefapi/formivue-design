import {
  createForm,
  isArrayField,
  isDataField,
  LifeCycleTypes,
  type Form,
} from '@formivue/core'
import { batch, observable } from '@formivue/reactive'
import { isEqual } from '@formivue/shared'
import {
  compileDataValidator,
  type DataSchemaValidationOptions,
  copyJson,
  DocumentValidationError,
  isJsonObject,
  jsonPointer,
  pointerSegments,
  projectDocumentRows,
  valueAt,
  type DocumentIssue,
  type JsonObject,
  type JsonValue,
} from './document-data'
import { applyJsonPatch, type JsonPatchOperation } from './document-patch'

export interface DocumentRowKey {
  /** null matches a row index in an enclosing array. */
  path: readonly (string | null)[]
  key: string
}

export interface DataDocumentOptions {
  schema: object
  data: unknown
  rowKeys?: readonly DocumentRowKey[]
  revision?: number
  validateBindings?: (data: JsonObject) => DocumentIssue[]
  schemaValidation?: DataSchemaValidationOptions
}

const editing = Symbol('Active field draft')

function rowEntries(rows: readonly unknown[], key: string) {
  const entries = new Map<string, unknown>()
  let drafts = 0
  for (const row of rows) {
    const id = valueAt(row, [key])
    const identity =
      typeof id === 'number' || typeof id === 'string'
        ? JSON.stringify(id)
        : `draft:${drafts++}`
    if (entries.has(identity)) return undefined
    entries.set(identity, row)
  }
  return entries
}

function makeReconciler(rowKeys: readonly DocumentRowKey[]) {
  const keyAt = (path: string[]) =>
    rowKeys.find(
      (row) =>
        row.path.length === path.length &&
        row.path.every((part, index) => part === null || part === path[index]),
    )?.key

  const validate = (data: JsonObject) => {
    const issues: DocumentIssue[] = []
    for (const { path, key } of rowKeys) {
      const visit = (value: unknown, index: number, location: string[]) => {
        if (index < path.length) {
          const part = path[index]
          if (part === null) {
            if (Array.isArray(value))
              value.forEach((row, rowIndex) =>
                visit(row, index + 1, [...location, String(rowIndex)]),
              )
          } else {
            visit(valueAt(value, [part]), index + 1, [...location, part])
          }
        } else if (Array.isArray(value)) {
          const entries = rowEntries(value, key)
          if (
            !entries ||
            Array.from(entries.keys()).some((id) => id.startsWith('draft:'))
          )
            issues.push({
              path: jsonPointer(location),
              message: `Every row needs a unique "${key}"`,
            })
        }
      }
      visit(data, 0, [])
    }
    return issues
  }

  function rebase(
    base: unknown,
    draft: unknown,
    next: unknown,
    path: string[],
    conflicts: Set<string>,
  ): unknown {
    if (isEqual(draft, base)) return next
    if (isEqual(next, base) || isEqual(draft, next)) return draft
    if (isJsonObject(base) && isJsonObject(draft) && isJsonObject(next)) {
      return Object.fromEntries(
        Array.from(
          new Set([
            ...Object.keys(base),
            ...Object.keys(draft),
            ...Object.keys(next),
          ]),
        ).flatMap((key) => {
          const value = rebase(
            valueAt(base, [key]),
            valueAt(draft, [key]),
            valueAt(next, [key]),
            [...path, key],
            conflicts,
          )
          return value === undefined ? [] : [[key, value]]
        }),
      )
    }

    const key = keyAt(path)
    if (
      key &&
      Array.isArray(base) &&
      Array.isArray(draft) &&
      Array.isArray(next)
    ) {
      const previousRows = rowEntries(base, key)
      const draftRows = rowEntries(draft, key)
      const nextRows = rowEntries(next, key)
      if (previousRows && draftRows && nextRows) {
        const common = Array.from(previousRows.keys()).filter(
          (id) => draftRows.has(id) && nextRows.has(id),
        )
        const order = (rows: typeof previousRows) =>
          Array.from(rows.keys()).filter((id) => common.includes(id))
        const localReorder = !isEqual(order(draftRows), common)
        if (
          localReorder &&
          !isEqual(order(nextRows), common) &&
          !isEqual(order(draftRows), order(nextRows))
        )
          conflicts.add(jsonPointer(path))
        const primary = localReorder ? draftRows : nextRows
        const secondary = localReorder ? nextRows : draftRows
        const ids = new Set([...primary.keys(), ...secondary.keys()])
        const rows = []
        for (const id of ids) {
          const rowPath = [...path, String(rows.length)]
          const value = rebase(
            previousRows.get(id),
            draftRows.get(id),
            nextRows.get(id),
            rowPath,
            conflicts,
          )
          if (value !== undefined) rows.push(value)
          else if (conflicts.delete(jsonPointer(rowPath)))
            conflicts.add(jsonPointer(path))
        }
        return rows
      }
    }

    conflicts.add(jsonPointer(path))
    return draft
  }

  function sync(target: JsonObject, source: JsonObject, form?: Form) {
    function update(
      current: JsonObject | JsonValue[],
      next: JsonObject | JsonValue[],
      path: string[],
    ) {
      if (Array.isArray(current) && Array.isArray(next)) {
        const key = keyAt(path)
        const present = key && rowEntries(current, key)
        const incoming = key && rowEntries(next, key)
        const field = form?.query(path).take()
        const arrayField = isArrayField(field) ? field : undefined
        const remove = (index: number) =>
          arrayField
            ? arrayField.spliceValue(index, 1)
            : void current.splice(index, 1)
        const insert = (index: number, value: JsonValue) =>
          arrayField
            ? arrayField.spliceValue(index, 0, [value])
            : void current.splice(index, 0, value)
        if (present && incoming) {
          const ids = Array.from(present.keys())
          for (let index = ids.length - 1; index >= 0; index--) {
            if (incoming.has(ids[index])) continue
            remove(index)
            ids.splice(index, 1)
          }
          Array.from(incoming.keys()).forEach((id, index) => {
            const oldIndex = ids.indexOf(id, index)
            if (oldIndex === -1) {
              insert(index, copyJson(next[index]))
              ids.splice(index, 0, id)
            } else if (oldIndex !== index) {
              if (arrayField) arrayField.moveValue(oldIndex, index)
              else current.splice(index, 0, current.splice(oldIndex, 1)[0])
              ids.splice(index, 0, ids.splice(oldIndex, 1)[0])
            }
          })
        }
        while (current.length > next.length) remove(current.length - 1)
        next.forEach((item, index) => {
          if (index === current.length) insert(index, copyJson(item))
          else assign(current, String(index), item, path)
        })
      } else {
        for (const key of Object.keys(current))
          if (!Object.prototype.hasOwnProperty.call(next, key))
            delete current[key]
        for (const [key, value] of Object.entries(next))
          assign(current, key, value, path)
      }
    }
    function assign(
      current: JsonObject | JsonValue[],
      key: string,
      value: JsonValue,
      path: string[],
    ) {
      const previous = current[key]
      if (isEqual(previous, value)) return
      if (
        (Array.isArray(previous) && Array.isArray(value)) ||
        (isJsonObject(previous) && isJsonObject(value))
      ) {
        update(previous, value, [...path, key])
      } else {
        current[key] = copyJson(value)
      }
    }
    update(target, source, [])
  }

  function relocate(path: string[], from: JsonObject, to: JsonObject) {
    let source: unknown = from
    let target: unknown = to
    const result: string[] = []
    for (const segment of path) {
      const key = keyAt(result)
      let destination = segment
      if (key && Array.isArray(source) && Array.isArray(target)) {
        const id = valueAt(source, [segment, key])
        if (id !== undefined) {
          const index = target.findIndex((row) => valueAt(row, [key]) === id)
          if (index < 0) return undefined
          destination = String(index)
        }
      }
      source = valueAt(source, [segment])
      target = valueAt(target, [destination])
      result.push(destination)
    }
    return result
  }

  return { validate, rebase, sync, relocate }
}

export function createDataDocument(options: DataDocumentOptions) {
  const validateSchema = compileDataValidator(
    options.schema,
    options.schemaValidation,
  )
  const reconcile = makeReconciler(options.rowKeys ?? [])
  const validate = (value: unknown): JsonObject => {
    const data = copyJson(value)
    if (!isJsonObject(data))
      throw new DocumentValidationError([
        { path: '', message: 'Expected an object' },
      ])
    const issues = validateSchema(data)
    if (!issues.length)
      issues.push(
        ...reconcile.validate(data),
        ...(options.validateBindings?.(data) ?? []),
      )
    if (issues.length) throw new DocumentValidationError(issues)
    return data
  }

  let baseline = validate(options.data)
  let revision = options.revision ?? 0
  if (!Number.isSafeInteger(revision) || revision < 0)
    throw new DocumentValidationError([
      { path: '', message: 'Invalid initial revision' },
    ])
  let syncing = false
  let disposed = false
  const state = observable({
    data: copyJson(baseline) as JsonObject,
    conflicts: [] as string[],
    issues: [] as DocumentIssue[],
  })
  const form = createForm({ values: copyJson(baseline) as JsonObject })
  const draftData = () => copyJson(form.values, true) as JsonObject
  const scope = {
    $document: {
      read(
        pointer: string,
        base: string[] = [],
        columns?: Record<string, string[]>,
      ) {
        const value = valueAt(state.data, [
          ...base,
          ...pointerSegments(pointer),
        ])
        // Tracking the subtree lets row edits update chart props in place.
        return value === undefined
          ? undefined
          : copyJson(columns ? projectDocumentRows(value, columns) : value)
      },
    },
  }

  function updateIssues(issues: DocumentIssue[]) {
    if (!isEqual(state.issues, issues)) state.issues = issues
    const messagesByPath = new Map<string, string[]>()
    for (const issue of issues) {
      const messages = messagesByPath.get(issue.path) ?? []
      messages.push(issue.message)
      messagesByPath.set(issue.path, messages)
    }
    for (const field of Object.values(form.fields)) {
      if (!isDataField(field)) continue
      field.setFeedback({
        type: 'error',
        code: 'DocumentSchemaError',
        messages: messagesByPath.get(jsonPointer(field.path.segments)) ?? [],
      })
    }
  }

  function publishDraft() {
    try {
      const data = validate(draftData())
      batch(() => {
        if (state.issues.length) updateIssues([])
        if (!state.conflicts.length) reconcile.sync(state.data, data)
      })
    } catch (error) {
      if (!(error instanceof DocumentValidationError)) throw error
      updateIssues([...error.issues])
    }
  }

  let queued = false
  const subscriber = form.subscribe(({ type }) => {
    if (type !== LifeCycleTypes.ON_FORM_VALUES_CHANGE || syncing || queued)
      return
    queued = true
    queueMicrotask(() => {
      queued = false
      if (!disposed) publishDraft()
    })
  })

  function replaceData(data: unknown, nextRevision = revision + 1) {
    if (!Number.isSafeInteger(nextRevision) || nextRevision <= revision)
      throw new DocumentValidationError([
        { path: '', message: `Expected a revision newer than ${revision}` },
      ])
    const next = validate(data)
    const overlaps = new Set<string>()
    const previousDraft = draftData()
    let comparison = baseline
    // Some controls (for example NumberPicker) commit their input on blur.
    // A remote write to an active field must preserve its in-progress text.
    for (const field of Object.values(form.fields)) {
      if (!isDataField(field) || !field.active) continue
      const path = field.path.segments.map(String)
      const oldPath = reconcile.relocate(path, previousDraft, baseline)
      if (!oldPath?.length) continue
      const newPath = reconcile.relocate(path, previousDraft, next)
      const previous = valueAt(baseline, oldPath)
      const local = valueAt(previousDraft, path)
      if (
        !isEqual(previous, local) ||
        (local !== null && typeof local === 'object') ||
        (newPath && isEqual(local, valueAt(next, newPath)))
      )
        continue
      if (comparison === baseline) comparison = copyJson(baseline) as JsonObject
      const parent = valueAt(comparison, oldPath.slice(0, -1))
      if (parent && typeof parent === 'object') {
        ;(parent as Record<string, unknown>)[oldPath[oldPath.length - 1]] =
          editing
      }
    }
    const draft = reconcile.rebase(
      comparison,
      previousDraft,
      next,
      [],
      overlaps,
    ) as JsonObject
    // Conflicts remain visible across unrelated refreshes until resolved.
    for (const path of state.conflicts) {
      const segments = reconcile.relocate(
        pointerSegments(path),
        previousDraft,
        draft,
      )
      if (!segments) continue
      const remote = reconcile.relocate(segments, draft, next)
      if (!remote || !isEqual(valueAt(draft, segments), valueAt(next, remote)))
        overlaps.add(jsonPointer(segments))
    }
    syncing = true
    try {
      batch(() => {
        reconcile.sync(form.values, draft, form)
        reconcile.sync(state.data, next)
        baseline = next
        revision = nextRevision
        state.conflicts = [...overlaps]
        publishDraft()
      })
    } finally {
      syncing = false
    }
    return { revision, conflicts: [...state.conflicts] }
  }

  const validateDraft = () => validate(draftData())
  const requireSubmission = () => {
    if (state.conflicts.length)
      throw new DocumentValidationError(
        state.conflicts.map((path) => ({
          path,
          message: 'Unresolved edit conflict',
        })),
      )
    return validateDraft()
  }
  const originalValidate = form.validate
  form.validate = async (pattern = '*') => {
    if (pattern === '*') requireSubmission()
    return originalValidate(pattern)
  }
  const originalSubmit = form.submit
  form.submit = <T>(callback?: (data: JsonObject) => Promise<T> | void) =>
    originalSubmit<T>(
      callback
        ? () => callback(requireSubmission())
        : async () => requireSubmission() as unknown as T,
    ).catch((error) => {
      if (
        Array.isArray(error) &&
        error.some((issue) => issue.code === 'DocumentSchemaError')
      )
        requireSubmission()
      throw error
    })

  return {
    form,
    scope,
    get revision() {
      return revision
    },
    get conflicts() {
      return [...state.conflicts]
    },
    get issues() {
      return [...state.issues]
    },
    exportData() {
      publishDraft()
      return copyJson(state.data) as JsonObject
    },
    validateDraft,
    replaceData,
    applyPatch(update: {
      baseRevision: number
      revision: number
      operations: readonly JsonPatchOperation[]
    }) {
      if (update.baseRevision !== revision)
        throw new DocumentValidationError([
          {
            path: '',
            message: `Patch requires revision ${update.baseRevision}, current revision is ${revision}`,
          },
        ])
      return replaceData(
        applyJsonPatch(baseline, update.operations),
        update.revision,
      )
    },
    resolveConflicts(keepDraft: boolean) {
      if (!keepDraft) {
        syncing = true
        try {
          batch(() => reconcile.sync(form.values, baseline, form))
        } finally {
          syncing = false
        }
      }
      state.conflicts = []
      publishDraft()
    },
    dispose() {
      disposed = true
      form.unsubscribe(subscriber)
      if (!form.unmounted) form.onUnmount()
    },
  }
}
