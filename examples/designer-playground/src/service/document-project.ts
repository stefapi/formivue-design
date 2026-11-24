import { computed, shallowRef } from 'vue'
import { isEqual } from '@formivue/shared'
import type { TreeNode } from '@formivue-design/core'
import {
  createFormDocumentProject,
  createFormDocumentVariant,
  materializeFormDocumentVariant,
  parseFormDocuments,
  reconcileFormDocumentProject,
  renameFormDocumentProperty,
  stringifyFormDocuments,
  transformToFormDocuments,
  type CompileFormDocumentOptions,
  type DocumentPropertyRename,
  type FormDocumentJson,
  type FormDocumentProject,
  type FormDocumentVariant,
  type FormDocuments,
} from '@formivue-design/formivue-transformer'
import { DocumentValidationError } from '@formivue/json-schema'

interface Draft {
  files: FormDocumentJson
  renames: FormDocumentVariant['renames']
}

interface SavedProject {
  version: 1
  project?: FormDocumentProject
  selected: string
  drafts: Record<string, Draft>
  applied?: FormDocuments
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
    const documents = transformToFormDocuments(tree, undefined, options)
    const saved = state.value
    if (!saved.project) {
      update({
        ...saved,
        project: createFormDocumentProject(documents, options),
      })
      return
    }
    const result = reconcileFormDocumentProject(
      saved.project,
      documents,
      options,
    )
    if (result.diagnostics.length)
      throw new DocumentValidationError(
        result.diagnostics.flatMap(({ variant, issues }) =>
          issues.map((issue) => ({
            ...issue,
            component: [variant, issue.component].filter(Boolean).join(' · '),
          })),
        ),
      )
    update({ ...saved, project: result.project })
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

  function reviewRename(rename: DocumentPropertyRename) {
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
    const { project, impact } = renameFormDocumentProperty(
      candidate,
      saved.selected,
      rename,
      options,
    )
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
    storageError,
    hasDraft: computed(() =>
      Object.prototype.hasOwnProperty.call(state.value.drafts, selected.value),
    ),
    generate,
    choose,
    addVariant,
    edit,
    reviewRename,
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
