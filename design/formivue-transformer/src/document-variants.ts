import {
  copyJson,
  DocumentValidationError,
  type DocumentIssue,
  type JsonObject,
} from '@formivue/json-schema'
import { generateFormDataSchema } from './document-generation'
import { documentError, documentPath, visitUiNodes } from './document-paths'
import {
  renameDocumentData,
  renameDocumentSchema,
  renameDocumentUi,
  type DocumentPropertyChange,
  type DocumentPropertyRename,
} from './document-rename'
import {
  moveDocumentData,
  moveDocumentSchema,
  pathStartsWith,
  validateMove,
  type DocumentPropertyMove,
} from './document-move'
import {
  createFormDocument,
  compileFormDocuments,
  type CompileFormDocumentOptions,
  type FormDocuments,
  type UiDocument,
} from './documents'

export interface FormDocumentVariant {
  readonly name: string
  readonly dataSchema: FormDocuments['dataSchema']
  readonly data: JsonObject
  readonly renames: readonly DocumentPropertyChange[]
}

export interface FormDocumentProject {
  readonly base: FormDocuments
  readonly variants: readonly FormDocumentVariant[]
}

interface ProjectOptions extends CompileFormDocumentOptions {
  data?: JsonObject
}

function validateDocuments(
  documents: FormDocuments,
  options: CompileFormDocumentOptions,
) {
  const session = createFormDocument(documents, options)
  try {
    return session.exportDocuments()
  } finally {
    session.dispose()
  }
}

export function createFormDocumentProject(
  source: UiDocument | FormDocuments,
  options: ProjectOptions = {},
): FormDocumentProject {
  if (!source || typeof source !== 'object')
    documentError(
      'invalid_ui_document',
      '/ui',
      'Expected a version 1 UI document',
    )
  const documents =
    'ui' in source
      ? source
      : {
          ui: source,
          dataSchema: generateFormDataSchema(source, options),
          data: options.data ?? {},
        }
  return { base: validateDocuments(documents, options), variants: [] }
}

function variantByName(project: FormDocumentProject, name: string) {
  return (
    project.variants.find((variant) => variant.name === name) ??
    documentError('unknown_variant', '/variants', `Unknown variant "${name}"`)
  )
}

export function createFormDocumentVariant(
  project: FormDocumentProject,
  name: string,
  from?: string,
): FormDocumentProject {
  const identifier = name.trim()
  if (
    !identifier ||
    project.variants.some((variant) => variant.name === identifier)
  )
    documentError(
      'invalid_variant_name',
      '/variants',
      'Variant names must be nonempty and unique',
    )
  const source =
    from === undefined ? project.base : variantByName(project, from)
  const variant: FormDocumentVariant = {
    name: identifier,
    dataSchema: copyJson(source.dataSchema) as FormDocuments['dataSchema'],
    data: copyJson(source.data) as JsonObject,
    renames:
      'renames' in source
        ? source.renames.map((change) =>
            'to' in change
              ? { path: [...change.path], to: [...change.to] }
              : { path: [...change.path], key: change.key },
          )
        : [],
  }
  return { ...project, variants: [...project.variants, variant] }
}

function materializeUi(
  project: FormDocumentProject,
  variant: FormDocumentVariant,
  options: CompileFormDocumentOptions,
) {
  return variant.renames.reduce(
    (ui, rename) => renameDocumentUi(ui, rename, options).ui,
    project.base.ui,
  )
}

/** Resolves a draft variant's UI without validating its example values. */
export function materializeFormDocumentVariant(
  project: FormDocumentProject,
  name: string,
  options: CompileFormDocumentOptions = {},
): FormDocuments {
  const variant = variantByName(project, name)
  return {
    ui: materializeUi(project, variant, options),
    dataSchema: variant.dataSchema,
    data: variant.data,
  }
}

export function exportFormDocumentVariant(
  project: FormDocumentProject,
  name: string,
  options: CompileFormDocumentOptions = {},
): FormDocuments {
  return validateDocuments(
    materializeFormDocumentVariant(project, name, options),
    options,
  )
}

/** Prepares a validated project and report without mutating the input project or its sessions. */
export function renameFormDocumentProperty(
  project: FormDocumentProject,
  name: string,
  { path, key }: DocumentPropertyRename,
  options: CompileFormDocumentOptions = {},
) {
  const from = documentPath(path)
  if (
    !path.length ||
    typeof path[path.length - 1] !== 'string' ||
    path.some((part) => part !== null && (typeof part !== 'string' || !part)) ||
    typeof key !== 'string' ||
    !key ||
    /[.[\]*,]|^(?:__proto__|prototype|constructor)$/u.test(key)
  )
    documentError(
      'invalid_property_rename',
      from,
      'Choose a property and a valid destination key at the same level',
    )

  const variant = variantByName(project, name)
  const to = documentPath([...path.slice(0, -1), key])
  if (from === to)
    return { project, impact: { from, to, componentIds: [] as string[] } }

  const rename = { path: [...path], key }
  const dataSchema = renameDocumentSchema(variant.dataSchema, rename)
  const data = renameDocumentData(variant.data, rename)
  const result = applyPropertyChange(
    project,
    variant,
    rename,
    dataSchema,
    data,
    options,
  )
  return {
    project: result.project,
    impact: { from, to, componentIds: result.componentIds },
  }
}

export function moveFormDocumentProperty(
  project: FormDocumentProject,
  name: string,
  change: DocumentPropertyMove,
  options: CompileFormDocumentOptions = {},
) {
  validateMove(change)
  const variant = variantByName(project, name)
  const from = documentPath(change.path)
  const to = documentPath(change.to)
  const impact = {
    from,
    to,
    componentIds: [] as string[],
    createdObjects: [] as string[],
    dependencies: compileFormDocuments(
      {
        ui: materializeUi(project, variant, options),
        dataSchema: variant.dataSchema,
      },
      options,
    ).dependencies.filter(({ path }) => pathStartsWith(path, change.path)),
  }
  if (from === to) return { project, impact }
  const move = { path: [...change.path], to: [...change.to] }
  const { dataSchema, createdObjects } = moveDocumentSchema(
    variant.dataSchema,
    move,
  )
  const data = moveDocumentData(variant.data, move)
  const result = applyPropertyChange(
    project,
    variant,
    move,
    dataSchema,
    data,
    options,
  )
  return {
    project: result.project,
    impact: { ...impact, createdObjects, componentIds: result.componentIds },
  }
}

function applyPropertyChange(
  project: FormDocumentProject,
  variant: FormDocumentVariant,
  change: DocumentPropertyChange,
  dataSchema: FormDocuments['dataSchema'],
  data: JsonObject,
  options: CompileFormDocumentOptions,
) {
  const { ui, componentIds } = renameDocumentUi(
    materializeUi(project, variant, options),
    change,
    options,
  )
  const validated = validateDocuments({ ui, dataSchema, data }, options)
  const updated: FormDocumentVariant = {
    ...variant,
    dataSchema: validated.dataSchema,
    data: validated.data,
    renames: [...variant.renames, change],
  }
  return {
    project: {
      ...project,
      variants: project.variants.map((entry) =>
        entry === variant ? updated : entry,
      ),
    },
    componentIds,
  }
}

/** Rechecks the saved variants against the next canvas export before adopting it. */
export function reconcileFormDocumentProject(
  project: FormDocumentProject,
  documents: FormDocuments,
  options: CompileFormDocumentOptions = {},
) {
  const base = validateDocuments(documents, options)
  const candidate: FormDocumentProject = { ...project, base }
  const diagnostics: { variant: string; issues: readonly DocumentIssue[] }[] =
    []
  const nodePaths = (ui: UiDocument) => {
    const paths = new Map<
      string,
      { path: string; kind: string; component?: string }
    >()
    visitUiNodes(ui, (node, _scope, path) => {
      if (node.kind === 'void') return
      paths.set(node.id, {
        path: documentPath(path),
        kind: node.kind,
        component: node.component,
      })
    })
    return paths
  }
  const previous = nodePaths(project.base.ui)
  const next = nodePaths(base.ui)
  for (const variant of project.variants) {
    const conflicts: DocumentIssue[] = []
    for (const [componentId, old] of previous) {
      const current = next.get(componentId)
      if (
        current &&
        current.path === old.path &&
        current.kind === old.kind &&
        current.component === old.component
      )
        continue
      conflicts.push({
        path: current?.path ?? old.path,
        component: current?.component ?? old.component,
        componentId,
        code: current ? 'changed_ui_binding' : 'removed_ui_binding',
        severity: 'error',
        message: `The canvas binding at "${old.path}" ${current ? 'changed' : 'was removed'}. Reconcile this variant before applying it`,
      })
    }
    if (!conflicts.length) {
      try {
        exportFormDocumentVariant(candidate, variant.name, options)
      } catch (error) {
        if (!(error instanceof DocumentValidationError)) throw error
        conflicts.push(...error.issues)
      }
    }
    if (conflicts.length)
      diagnostics.push({ variant: variant.name, issues: conflicts })
  }
  return { project: diagnostics.length ? project : candidate, diagnostics }
}
