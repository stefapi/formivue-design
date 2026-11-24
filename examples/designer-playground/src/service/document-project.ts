import { computed, shallowRef } from 'vue'
import { isEqual } from '@formivue/shared'
import type { TreeNode } from '@formivue-design/core'
import {
  createFormDocumentProject,
  createFormDocumentVariant,
  defaultCanvasRenameChoice,
  materializedCanvasPath,
  materializeFormDocumentVariant,
  moveFormDocumentProperty,
  parseFormDocuments,
  planVariantReconciliation,
  prepareFormDocumentReconciliation,
  reconcileVariantData,
  reconcileVariantSchema,
  renameFormDocumentProperty,
  stringifyFormDocuments,
  transformToFormDocuments,
  type CompileFormDocumentOptions,
  type CanvasRenameChoice,
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

interface Draft {
  files: FormDocumentJson
  renames: FormDocumentVariant['renames']
}

type ReviewedChange = {
  impact:
    | ReturnType<typeof renameFormDocumentProperty>['impact']
    | ReturnType<typeof moveFormDocumentProperty>['impact']
  confirm(): boolean
}

interface SavedProject {
  version: 1
  project?: FormDocumentProject
  selected: string
  drafts: Record<string, Draft>
  applied?: FormDocuments
}

type ReconciliationChoices = Record<string, Record<string, CanvasRenameChoice>>
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
  choices: ReconciliationChoices
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
    }
  })
  const files = computed(() => current.value?.files)

  function storeDraft(draft: Draft) {
    const saved = state.value
    update({ ...saved, drafts: { ...saved.drafts, [saved.selected]: draft } })
  }

  function edit(next: FormDocumentJson) {
    storeDraft({ files: next, renames: current.value?.renames ?? [] })
  }

  function generate(tree: TreeNode) {
    reconciliation.value = undefined
    const documents = transformToFormDocuments(tree, undefined, options)
    const saved = state.value
    if (!saved.project) {
      update({
        ...saved,
        project: createFormDocumentProject(documents, options),
      })
      return
    }
    const prepared = prepareFormDocumentReconciliation(
      saved.project,
      documents,
      options,
    )
    const renames = prepared.changes.filter(({ kind }) => kind === 'rename')
    const variants = saved.project.variants.map((variant) => ({
      name: variant.name,
      fields: renames.map((change) => ({
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
    const choices = Object.fromEntries(
      variants.map(({ name, fields }) => [
        name,
        Object.fromEntries(
          fields.map(({ path, draftPath, componentId }, index) => [
            componentId,
            defaultCanvasRenameChoice(draftPath ?? path, renames[index]),
          ]),
        ),
      ]),
    )
    const review: Reconciliation = {
      changes: prepared.changes,
      variants,
      choices,
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
                    prepared.changes,
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
              state.value.project !== saved.project ||
              state.value.drafts !== saved.drafts
            )
              return false
            try {
              if (
                !isEqual(
                  transformToFormDocuments(tree, undefined, options),
                  documents,
                )
              )
                return false
            } catch {
              return false
            }
            update({ ...state.value, project: result.project, drafts })
            reconciliation.value = undefined
            return true
          },
        }
      },
    }
    if (!Object.keys(saved.drafts).length && !variants.length) {
      review.check(choices).confirm()
    } else if (!prepared.changes.length && review.check(choices).confirm()) {
      return
    } else {
      reconciliation.value = review
    }
  }

  function rebaseDraft(
    before: FormDocumentProject,
    after: FormDocumentProject,
    changes: readonly CanvasBindingChange[],
    choices: ReconciliationChoices,
    name: string,
    draft: Draft,
  ): Draft {
    const plan = planVariantReconciliation(
      draft.renames,
      changes,
      name ? choices[name] : undefined,
    )
    const materialize = (
      project: FormDocumentProject,
      renames: Draft['renames'],
    ) =>
      name
        ? materializeFormDocumentVariant(
            {
              ...project,
              variants: project.variants.map((variant) =>
                variant.name === name ? { ...variant, renames } : variant,
              ),
            },
            name,
            options,
          ).ui
        : project.base.ui
    const oldUi = materialize(before, draft.renames)
    const nextUi = materialize(after, plan.renames)
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
    if (!isEqual(oldUi, nextUi)) {
      if (!isEqual(oldUi, json('ui')))
        throw new DocumentValidationError([
          {
            path: '/ui',
            code: 'reconciliation_draft_ui',
            message:
              'The draft UI has independent edits. Reconcile them before changing the canvas version.',
          },
        ])
      files.ui = JSON.stringify(nextUi, null, 2)
    }
    if (plan.keys.length) {
      files.dataSchema = JSON.stringify(
        reconcileVariantSchema(json('dataSchema'), plan),
        null,
        2,
      )
      files.data = JSON.stringify(
        reconcileVariantData(json('data'), plan),
        null,
        2,
      )
    }
    return { files, renames: plan.renames }
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
          ? { ...variant, dataSchema, data, renames: draft.renames }
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
            ? { ...variant, renames: current.value.renames }
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
        next = { ...existing, base: documents }
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
    cancelReconciliation() {
      reconciliation.value = undefined
    },
    storageError,
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
      update({ ...emptyProject(), project })
    },
  }
}

export type DocumentProject = ReturnType<typeof useDocumentProject>
