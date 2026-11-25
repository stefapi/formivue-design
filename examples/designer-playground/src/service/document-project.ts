import { computed, shallowRef } from 'vue'
import { isEqual } from '@formivue/shared'
import type { ITreeNode, TreeNode } from '@formivue-design/core'
import {
  compileFormDocuments,
  createFormDocumentProject,
  createFormDocumentVariant,
  chooseCanvasAction,
  materializedCanvasPath,
  materializeFormDocumentVariant,
  moveFormDocumentProperty,
  parseFormDocuments,
  prepareFormDocumentReconciliation,
  renameFormDocumentProperty,
  stringifyFormDocuments,
  transformToFormDocuments,
  type CompileFormDocumentOptions,
  type CanvasReconciliationChoice,
  type CanvasBindingChange,
  type DocumentDataPath,
  type DocumentPropertyMove,
  type DocumentPropertyRename,
  type FormDocumentJson,
  type FormDocumentProject,
  type FormDocumentVariant,
  type FormDocuments,
} from '@formivue-design/formivue-transformer'
import {
  DocumentValidationError,
  isJsonObject,
  type DocumentIssue,
} from '@formivue/json-schema'

import {
  parseDocumentProject,
  stringifyDocumentProject,
  type DocumentProjectArchive,
  type ProjectDraft as Draft,
  type PendingReconciliation,
  type ReconciliationChoices,
  type SavedDocumentProject as SavedProject,
} from './document-project-archive'

type ReviewedChange = {
  impact:
    | ReturnType<typeof renameFormDocumentProperty>['impact']
    | ReturnType<typeof moveFormDocumentProperty>['impact']
  confirm(): boolean
}

type Reconciliation = {
  changes: readonly CanvasBindingChange[]
  variants: readonly {
    name: string
    fields: readonly {
      componentId: string
      path: DocumentDataPath
      draftPath?: DocumentDataPath
    }[]
  }[]
  readonly choices: ReconciliationChoices
  readonly stale: boolean
  selectChoice(
    name: string,
    id: string,
    choice: CanvasReconciliationChoice,
  ): void
  check(choices: ReconciliationChoices): {
    diagnostics: readonly {
      variant: string
      issues: readonly DocumentIssue[]
    }[]
    confirm(): boolean
  }
}

const emptyProject = (): SavedProject => ({
  version: 1,
  selected: '',
  drafts: {},
})

export function useDocumentProject(
  storageKey: string,
  options: CompileFormDocumentOptions,
  applyPreview: (documents: FormDocuments) => readonly string[] | void,
) {
  const storageError = shallowRef(false)
  function restore(): SavedProject {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
      if (
        saved?.version === 1 &&
        typeof saved.selected === 'string' &&
        saved.drafts &&
        typeof saved.drafts === 'object'
      )
        return saved
    } catch {
      storageError.value = true
    }
    return emptyProject()
  }
  const state = shallowRef(restore())
  const reconciliation = shallowRef<Reconciliation>()
  const update = (next: SavedProject) => {
    const previous = state.value
    if (
      next.pendingReconciliation &&
      next.pendingReconciliation === previous.pendingReconciliation &&
      (next.project !== previous.project || next.drafts !== previous.drafts)
    )
      next = {
        ...next,
        pendingReconciliation: { ...next.pendingReconciliation, stale: true },
      }
    state.value = next
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
      storageError.value = false
    } catch {
      storageError.value = true
    }
  }
  const project = computed(() => state.value.project)
  const selected = computed(() => state.value.selected)
  const current = computed<Draft | undefined>(() => {
    const saved = state.value
    const draft = Object.prototype.hasOwnProperty.call(
      saved.drafts,
      saved.selected,
    )
      ? saved.drafts[saved.selected]
      : undefined
    if (draft || !saved.project) return draft
    const variant = saved.project.variants.find(
      ({ name }) => name === saved.selected,
    )
    return {
      files: stringifyFormDocuments(
        variant
          ? materializeFormDocumentVariant(saved.project, variant.name, options)
          : saved.project.base,
      ),
      renames: variant?.renames ?? [],
      uiOverrides: variant?.uiOverrides,
    }
  })
  const files = computed(() => current.value?.files)

  function storeDraft(draft: Draft) {
    const saved = state.value
    update({ ...saved, drafts: { ...saved.drafts, [saved.selected]: draft } })
  }

  function edit(next: FormDocumentJson) {
    storeDraft({
      files: next,
      renames: current.value?.renames ?? [],
      uiOverrides: current.value?.uiOverrides,
    })
  }

  function cancelReconciliation() {
    reconciliation.value = undefined
    if (state.value.pendingReconciliation)
      update({ ...state.value, pendingReconciliation: undefined })
  }

  function canvasMatches(tree: TreeNode, proposed: FormDocuments) {
    try {
      return isEqual(
        transformToFormDocuments(tree, undefined, options),
        proposed,
      )
    } catch {
      return false
    }
  }

  function generate(tree: TreeNode) {
    cancelReconciliation()
    const documents = transformToFormDocuments(tree, undefined, options)
    const saved = state.value
    if (!saved.project) {
      update({
        ...saved,
        project: createFormDocumentProject(documents, options),
      })
      return
    }
    const review = createReview(tree, documents)
    reconciliation.value = review
    if (
      (!review.changes.length ||
        (!Object.keys(saved.drafts).length && !review.variants.length)) &&
      review.check(review.choices).confirm()
    )
      return
    update({
      ...state.value,
      pendingReconciliation: { proposed: documents, choices: review.choices },
    })
  }

  function restoreReconciliation(tree: TreeNode) {
    const pending = state.value.pendingReconciliation
    if (!pending) return
    const review = createReview(tree, pending.proposed, pending)
    update({
      ...state.value,
      pendingReconciliation: {
        ...pending,
        choices: review.choices,
        stale: pending.stale || !canvasMatches(tree, pending.proposed),
      },
    })
    reconciliation.value = review
  }

  function createReview(
    tree: TreeNode,
    proposed: FormDocuments,
    remembered?: PendingReconciliation,
  ): Reconciliation {
    const saved = state.value
    const prepared = prepareFormDocumentReconciliation(
      saved.project,
      proposed,
      options,
    )
    const variants = saved.project.variants.map((variant) => ({
      name: variant.name,
      fields: prepared.changes
        .filter(
          (change) =>
            change.kind !== 'rename' ||
            !variant.uiOverrides?.some(({ id }) => id === change.componentId),
        )
        .map((change) => ({
          componentId: change.componentId,
          path: materializedCanvasPath(change, variant.renames),
          draftPath: Object.prototype.hasOwnProperty.call(
            saved.drafts,
            variant.name,
          )
            ? materializedCanvasPath(change, saved.drafts[variant.name].renames)
            : undefined,
        })),
    }))
    const defaultChoices = Object.fromEntries(
      variants.map(({ name, fields }) => [
        name,
        Object.fromEntries(
          fields.map(({ path, draftPath, componentId }) => [
            componentId,
            chooseCanvasAction(
              prepared.changes.find(
                (change) => change.componentId === componentId,
              ),
              draftPath ?? path,
              remembered?.choices[name],
            ),
          ]),
        ),
      ]),
    )
    const pending = () => {
      const value = state.value.pendingReconciliation
      return value?.proposed === proposed ? value : undefined
    }
    const review: Reconciliation = {
      changes: prepared.changes,
      variants,
      get choices() {
        return reconciliation.value === review
          ? (pending()?.choices ?? defaultChoices)
          : defaultChoices
      },
      get stale() {
        return !!pending()?.stale
      },
      selectChoice(name, id, choice) {
        const open = pending()
        const change = prepared.changes.find(
          (change) => change.componentId === id,
        )
        const field = variants
          .find((variant) => variant.name === name)
          ?.fields.find((field) => field.componentId === id)
        if (!open || reconciliation.value !== review || !field || !change)
          return
        const selected = chooseCanvasAction(
          change,
          field.draftPath ?? field.path,
          { [id]: choice },
        )
        update({
          ...state.value,
          pendingReconciliation: {
            ...open,
            choices: {
              ...open.choices,
              [name]: { ...open.choices[name], [id]: selected },
            },
          },
        })
      },
      check(choices) {
        const result = prepared.resolve(choices)
        const diagnostics = [...result.diagnostics]
        let drafts = saved.drafts
        if (!diagnostics.length) {
          drafts = Object.fromEntries(
            Object.entries(saved.drafts).map(([name, draft]) => {
              try {
                return [
                  name,
                  rebaseDraft(
                    saved.project,
                    result.project,
                    prepared,
                    choices,
                    name,
                    draft,
                  ),
                ]
              } catch (cause) {
                if (!(cause instanceof DocumentValidationError)) throw cause
                diagnostics.push({ variant: name, issues: cause.issues })
                return [name, draft]
              }
            }),
          )
        }
        return {
          diagnostics,
          confirm() {
            if (
              diagnostics.length ||
              reconciliation.value !== review ||
              review.stale ||
              state.value.project !== saved.project ||
              state.value.drafts !== saved.drafts
            )
              return false
            if (!canvasMatches(tree, proposed)) {
              const open = pending()
              if (open)
                update({
                  ...state.value,
                  pendingReconciliation: { ...open, stale: true },
                })
              return false
            }
            update({
              ...state.value,
              project: result.project,
              drafts,
              pendingReconciliation: undefined,
            })
            reconciliation.value = undefined
            return true
          },
        }
      },
    }
    return review
  }

  function rebaseDraft(
    before: FormDocumentProject,
    reconciled: FormDocumentProject,
    prepared: ReturnType<typeof prepareFormDocumentReconciliation>,
    choices: ReconciliationChoices,
    name: string,
    draft: Draft,
  ): Draft {
    const applied = name
      ? reconciled.variants.find((variant) => variant.name === name)
      : { ...reconciled.base, renames: [] }
    const oldUi = name
      ? materializeFormDocumentVariant(
          {
            ...before,
            variants: before.variants.map((variant) =>
              variant.name === name
                ? {
                    ...variant,
                    renames: draft.renames,
                    uiOverrides: draft.uiOverrides,
                  }
                : variant,
            ),
          },
          name,
          options,
        ).ui
      : before.base.ui
    const files = { ...draft.files }
    const json = (part: keyof FormDocumentJson) => {
      try {
        const value = JSON.parse(files[part])
        if (isJsonObject(value)) return value
      } catch {
        // Keep the original text intact for correction.
      }
      throw new DocumentValidationError([
        {
          path: '/' + part,
          code: 'reconciliation_draft_json',
          message: 'Correct this draft JSON before migrating it.',
        },
      ])
    }
    let draftSchema: FormDocuments['dataSchema'] | undefined
    try {
      draftSchema = json('dataSchema')
    } catch {
      // Leave unfinished JSON intact unless the canvas change needs the schema.
    }
    const { ui, renames, uiOverrides, dataChanges } = prepared.migrate(
      {
        renames: draft.renames,
        uiOverrides: draft.uiOverrides,
        get dataSchema() {
          return draftSchema ?? json('dataSchema')
        },
        get data() {
          return json('data')
        },
      },
      name ? choices[name] : undefined,
      !name,
      { restoreMissingSchema: !!draftSchema, applied },
    )
    const uiChanged = !isEqual(oldUi, ui)
    if (uiChanged) {
      if (!isEqual(oldUi, json('ui')))
        throw new DocumentValidationError([
          {
            path: '/ui',
            code: 'reconciliation_draft_ui',
            message:
              'The draft UI has independent edits. Reconcile them before changing the canvas version.',
          },
        ])
      files.ui = JSON.stringify(ui, null, 2)
    }
    if (dataChanges) {
      files.dataSchema = JSON.stringify(dataChanges.dataSchema, null, 2)
      files.data = JSON.stringify(dataChanges.data, null, 2)
    }
    if (uiChanged || dataChanges)
      compileFormDocuments(
        {
          ui: uiChanged ? ui : (json('ui') as unknown as FormDocuments['ui']),
          dataSchema: dataChanges?.dataSchema ?? json('dataSchema'),
        },
        options,
      )
    return { files, renames, uiOverrides }
  }

  function choose(name: string) {
    update({ ...state.value, selected: name })
  }

  function addVariant(name: string, duplicate: boolean) {
    const saved = state.value
    if (!saved.project) return
    const source = duplicate && saved.selected ? saved.selected : undefined
    const next = createFormDocumentVariant(saved.project, name, source)
    const variant = next.variants[next.variants.length - 1]
    update({ ...saved, project: next, selected: variant.name })
  }

  function reviewChange(
    change: DocumentPropertyRename | DocumentPropertyMove,
  ): ReviewedChange | undefined {
    const saved = state.value
    const draft = current.value
    if (!saved.project || !saved.selected || !draft) return
    const { dataSchema, data } = parseFormDocuments(draft.files)
    const candidate = {
      ...saved.project,
      variants: saved.project.variants.map((variant) =>
        variant.name === saved.selected
          ? {
              ...variant,
              dataSchema,
              data,
              renames: draft.renames,
              uiOverrides: draft.uiOverrides,
            }
          : variant,
      ),
    }
    const { project, impact } =
      'to' in change
        ? moveFormDocumentProperty(candidate, saved.selected, change, options)
        : renameFormDocumentProperty(candidate, saved.selected, change, options)
    const next = project.variants.find(({ name }) => name === saved.selected)
    const renamed = materializeFormDocumentVariant(
      project,
      saved.selected,
      options,
    )
    return {
      impact,
      confirm() {
        if (current.value !== draft) return false
        storeDraft({
          files: stringifyFormDocuments(renamed),
          renames: next.renames,
          uiOverrides: next.uiOverrides,
        })
        return true
      },
    }
  }

  function apply(documents: FormDocuments) {
    const saved = state.value
    const existing = saved.project
    let name = saved.selected
    let next: FormDocumentProject
    if (!existing) {
      next = createFormDocumentProject(documents, options)
    } else {
      const variants = existing.variants.map((variant) => {
        const active = variant.name === saved.selected
        return {
          variant: active
            ? {
                ...variant,
                renames: current.value.renames,
                uiOverrides: current.value.uiOverrides,
              }
            : variant,
          active,
        }
      })
      const candidate = {
        ...existing,
        variants: variants.map(({ variant }) => variant),
      }
      const currentVariant = variants.find(({ active }) => active)?.variant
      const materialized = (variant: FormDocumentVariant) =>
        materializeFormDocumentVariant(candidate, variant.name, options)
      const matching =
        currentVariant && isEqual(materialized(currentVariant).ui, documents.ui)
          ? currentVariant
          : isEqual(existing.base.ui, documents.ui)
            ? undefined
            : variants
                .map(({ variant }) => variant)
                .find((variant) =>
                  isEqual(materialized(variant).ui, documents.ui),
                )
      if (matching) {
        name = matching.name
        next = {
          ...existing,
          variants: existing.variants.map((variant) =>
            variant.name === matching.name
              ? {
                  ...matching,
                  dataSchema: documents.dataSchema,
                  data: documents.data,
                }
              : variant,
          ),
        }
      } else {
        if (
          existing.variants.length &&
          !isEqual(existing.base.ui, documents.ui)
        )
          throw new DocumentValidationError([
            {
              path: '/ui',
              code: 'unmatched_variant_ui',
              message:
                'The UI does not match this project or any of its variants',
            },
          ])
        name = ''
        next = isEqual(existing.base.ui, documents.ui)
          ? {
              ...existing,
              base: documents,
              canvasDataSchema:
                existing.canvasDataSchema ?? existing.base.dataSchema,
            }
          : { base: documents, variants: existing.variants }
      }
    }
    const conflicts = applyPreview(documents)
    const drafts = { ...saved.drafts }
    delete drafts[name]
    update({
      ...saved,
      project: next,
      selected: name,
      applied: documents,
      drafts,
    })
    return conflicts
  }

  function resetDraft() {
    const saved = state.value
    const drafts = { ...saved.drafts }
    delete drafts[saved.selected]
    update({ ...saved, drafts })
  }

  return {
    project,
    selected,
    files,
    reconciliation,
    cancelReconciliation,
    storageError,
    exportArchive(canvas: ITreeNode) {
      return stringifyDocumentProject(canvas, state.value)
    },
    readArchive(source: string) {
      return parseDocumentProject(source, options)
    },
    importArchive(archive: DocumentProjectArchive, tree?: TreeNode) {
      reconciliation.value = undefined
      update(archive.state)
      if (tree) restoreReconciliation(tree)
    },
    restoreReconciliation,
    hasDraft: computed(() =>
      Object.prototype.hasOwnProperty.call(state.value.drafts, selected.value),
    ),
    generate,
    choose,
    addVariant,
    edit,
    reviewRename: (change: DocumentPropertyRename) => reviewChange(change),
    reviewMove: (change: DocumentPropertyMove) => reviewChange(change),
    apply,
    resetDraft,
    restorePreview() {
      if (state.value.applied) applyPreview(state.value.applied)
    },
    clearPreview() {
      update({ ...state.value, applied: undefined })
    },
    install(project: FormDocumentProject) {
      reconciliation.value = undefined
      update({ ...emptyProject(), project })
    },
  }
}

export type DocumentProject = ReturnType<typeof useDocumentProject>
