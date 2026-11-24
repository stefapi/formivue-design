import type { ITreeNode } from '@formivue-design/core'
import {
  createFormDocument,
  exportFormDocumentVariant,
  materializeFormDocumentVariant,
  type CompileFormDocumentOptions,
  type FormDocumentJson,
  type FormDocumentProject,
  type FormDocumentVariant,
  type FormDocuments,
} from '@formivue-design/formivue-transformer'
import {
  compileDataValidator,
  copyJson,
  DocumentValidationError,
  isJsonObject,
  jsonPointer,
} from '@formivue/json-schema'

export interface ProjectDraft {
  files: FormDocumentJson
  renames: FormDocumentVariant['renames']
  uiOverrides?: FormDocumentVariant['uiOverrides']
}

export interface SavedDocumentProject {
  version: 1
  project?: FormDocumentProject
  selected: string
  drafts: Record<string, ProjectDraft>
  applied?: FormDocuments
}

const archiveFormat = 'formivue.designer-project'

export interface DocumentProjectArchive {
  format: typeof archiveFormat
  version: 1
  canvas: ITreeNode
  state: SavedDocumentProject
}

export function stringifyDocumentProject(
  canvas: ITreeNode,
  state: SavedDocumentProject,
) {
  return JSON.stringify(
    { format: archiveFormat, version: 1, canvas, state },
    null,
    2,
  )
}

function invalidArchive(
  path: string,
  message = 'Invalid project archive section.',
  code = 'project_archive_invalid',
): never {
  throw new DocumentValidationError([{ path, code, message }])
}

function objectAt(value: unknown, path: string): Record<string, unknown> {
  if (!isJsonObject(value)) invalidArchive(path)
  return value
}

function validateAt(path: string, validate: () => void) {
  try {
    validate()
  } catch (cause) {
    if (cause instanceof DocumentValidationError)
      throw new DocumentValidationError(
        cause.issues.map((issue) => ({ ...issue, path: path + issue.path })),
      )
    invalidArchive(path)
  }
}

function readCanvas(value: unknown) {
  const ids = new Set<string>()
  function nodeAt(value: unknown, path: string): ITreeNode {
    const node = objectAt(value, path)
    const { id, componentName, sourceName, props, hidden, children } = node
    if (typeof id !== 'string' || !id || ids.has(id))
      invalidArchive(path + '/id')
    if (typeof componentName !== 'string' || !componentName)
      invalidArchive(path + '/componentName')
    if (sourceName !== undefined && typeof sourceName !== 'string')
      invalidArchive(path + '/sourceName')
    if (hidden !== undefined && typeof hidden !== 'boolean')
      invalidArchive(path + '/hidden')
    if (!Array.isArray(children)) invalidArchive(path + '/children')
    ids.add(id)
    validateAt(path + '/props', () => {
      copyJson(objectAt(props, ''))
    })
    return {
      id,
      componentName,
      sourceName: sourceName as string | undefined,
      hidden: hidden as boolean | undefined,
      props: props as ITreeNode['props'],
      children: children.map((child, index) =>
        nodeAt(child, path + '/children/' + index),
      ),
    }
  }
  return nodeAt(value, '/canvas')
}

function validatePathHistory(value: Record<string, unknown>, path: string) {
  const key = (part: unknown) =>
    typeof part === 'string' &&
    part.length > 0 &&
    !/[.[\]*,]|^(?:__proto__|prototype|constructor)$/u.test(part)
  const address = (parts: unknown) =>
    Array.isArray(parts) &&
    key(parts[parts.length - 1]) &&
    parts.every((part) => part === null || key(part))
  if (!Array.isArray(value.renames)) invalidArchive(path + '/renames')
  value.renames.forEach((entry, index) => {
    const location = path + '/renames/' + index
    const change = objectAt(entry, location)
    if (
      !address(change.path) ||
      ('to' in change ? !address(change.to) : !key(change.key))
    )
      invalidArchive(location)
  })
  if (value.uiOverrides === undefined) return
  if (!Array.isArray(value.uiOverrides)) invalidArchive(path + '/uiOverrides')
  const ids = new Set<string>()
  value.uiOverrides.forEach((entry, index) => {
    const location = path + '/uiOverrides/' + index
    const override = objectAt(entry, location)
    if (typeof override.id !== 'string' || !override.id || ids.has(override.id))
      invalidArchive(location + '/id')
    ids.add(override.id)
    if (override.omit === true) return
    const node = objectAt(override.node, location + '/node')
    if (
      node.id !== override.id ||
      typeof node.key !== 'string' ||
      !['field', 'object', 'array', 'void'].includes(node.kind as string) ||
      (override.parent !== undefined && typeof override.parent !== 'string') ||
      !Number.isInteger(override.index)
    )
      invalidArchive(location)
    validateAt(location + '/node', () => {
      copyJson(node)
    })
  })
}

function readDocuments(
  value: unknown,
  path: string,
  options: CompileFormDocumentOptions,
) {
  const entry = objectAt(value, path)
  for (const key of ['ui', 'dataSchema', 'data'])
    objectAt(entry[key], path + '/' + key)
  const documents = entry as unknown as FormDocuments
  validateAt(path, () => {
    createFormDocument(documents, options).dispose()
  })
  return documents
}

export function parseDocumentProject(
  source: string,
  options: CompileFormDocumentOptions,
): DocumentProjectArchive {
  let parsed: unknown
  try {
    parsed = JSON.parse(source)
  } catch {
    invalidArchive(
      '/',
      'The file does not contain valid JSON.',
      'project_archive_json',
    )
  }
  const archive = objectAt(parsed, '/')
  if (archive.format !== archiveFormat || archive.version !== 1)
    invalidArchive(
      '/',
      'Unsupported project archive format or version.',
      'project_archive_version',
    )
  const canvas = readCanvas(archive.canvas)
  const state = objectAt(archive.state, '/state')
  if (state.version !== 1) invalidArchive('/state/version')
  const drafts = objectAt(state.drafts, '/state/drafts')
  const variants = new Map<string, FormDocumentVariant>()
  let project: FormDocumentProject | undefined
  if (state.project !== undefined) {
    const path = '/state/project'
    const entry = objectAt(state.project, path)
    readDocuments(entry.base, path + '/base', options)
    if (entry.canvasDataSchema !== undefined) {
      const schema = objectAt(
        entry.canvasDataSchema,
        path + '/canvasDataSchema',
      )
      validateAt(path + '/canvasDataSchema', () => {
        compileDataValidator(schema, options.schemaValidation)
      })
    }
    if (!Array.isArray(entry.variants)) invalidArchive(path + '/variants')
    project = entry as unknown as FormDocumentProject
    entry.variants.forEach((value, index) => {
      const location = path + '/variants/' + index
      const variant = objectAt(value, location)
      if (
        typeof variant.name !== 'string' ||
        !variant.name.trim() ||
        variants.has(variant.name)
      )
        invalidArchive(location + '/name')
      objectAt(variant.dataSchema, location + '/dataSchema')
      objectAt(variant.data, location + '/data')
      validatePathHistory(variant, location)
      validateAt(location, () => {
        exportFormDocumentVariant(project, variant.name as string, options)
      })
      variants.set(variant.name, variant as unknown as FormDocumentVariant)
    })
  }
  if (
    typeof state.selected !== 'string' ||
    (state.selected && !variants.has(state.selected))
  )
    invalidArchive('/state/selected')
  for (const [name, value] of Object.entries(drafts)) {
    const path = '/state/drafts' + jsonPointer([name])
    const variant = variants.get(name)
    if (name && !variant) invalidArchive(path)
    const draft = objectAt(value, path)
    const files = objectAt(draft.files, path + '/files')
    // Draft documents are editor text and may be incomplete or invalid JSON.
    for (const key of ['ui', 'dataSchema', 'data'])
      if (typeof files[key] !== 'string') invalidArchive(path + '/files/' + key)
    validatePathHistory(draft, path)
    if (variant)
      validateAt(path, () => {
        materializeFormDocumentVariant(
          {
            ...project,
            variants: [
              {
                ...variant,
                renames: draft.renames as ProjectDraft['renames'],
                uiOverrides: draft.uiOverrides as ProjectDraft['uiOverrides'],
              },
            ],
          },
          name,
          options,
        )
      })
  }
  if (state.applied !== undefined)
    readDocuments(state.applied, '/state/applied', options)
  return {
    format: archiveFormat,
    version: 1,
    canvas,
    state: state as unknown as SavedDocumentProject,
  }
}
