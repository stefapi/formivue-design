import {
  isJsonObject,
  pointerSegments,
  type JsonValue,
} from '@formivue/json-schema'
import {
  documentDataTypes,
  standardDocumentContracts,
  type DocumentDataType,
} from './document-contracts'
import {
  compileFormDocuments,
  type CompileFormDocumentOptions,
  type FormDocuments,
  type UiDocument,
} from './documents'
import {
  documentError,
  documentPath,
  visitUiNodes,
  type DocumentDataPath,
} from './document-paths'
import type { DataSchema } from './document-schema'

type ObjectSchema = Exclude<DataSchema, boolean>
const schemaVersion = 'https://json-schema.org/draft/2020-12/schema'

interface Requirement {
  path: DocumentDataPath
  types?: DocumentDataType[]
  annotations?: ObjectSchema
}

/** Derives the schema from the UI's declared data dependencies. */
export function generateFormDataSchema(
  ui: UiDocument,
  options: CompileFormDocumentOptions = {},
): FormDocuments['dataSchema'] {
  const contracts = options.contracts ?? standardDocumentContracts
  const requirements = new Map<string, Requirement>()
  const branchHints = new Map<
    string,
    { path: DocumentDataPath; types: Set<DocumentDataType> }
  >()
  const rowKeys: { path: DocumentDataPath; key: string }[] = []

  function requireTypes(
    path: DocumentDataPath,
    types?: readonly DocumentDataType[],
    annotations?: ObjectSchema,
  ) {
    const location = documentPath(path)
    const id = JSON.stringify(path)
    const before = requirements.get(id)
    let allowed = before?.types
    if (types?.length) {
      const next = [
        ...new Set<DocumentDataType>(
          types.includes('number') ? [...types, 'integer'] : types,
        ),
      ]
      allowed = allowed ? allowed.filter((type) => next.includes(type)) : next
      if (!allowed.length)
        documentError(
          'incompatible_data_requirements',
          location,
          'UI components require incompatible data types',
        )
    }
    requirements.set(id, {
      path,
      types: allowed,
      annotations: { ...before?.annotations, ...annotations },
    })
  }

  function requirePath(
    path: DocumentDataPath,
    types?: readonly DocumentDataType[],
    annotations?: ObjectSchema,
  ) {
    for (let i = 0; i < path.length; i++)
      requireTypes(path.slice(0, i), [path[i] === null ? 'array' : 'object'])
    requireTypes(path, types, annotations)
  }

  requireTypes([], ['object'])
  visitUiNodes(ui, (node, scope, path) => {
    const contract = contracts.resolve(node.component, node.props)
    if (node.kind !== 'void') {
      const types =
        node.kind === 'field' ? contract?.types : ([node.kind] as const)
      const annotations: ObjectSchema = {}
      for (const key of ['title', 'description', 'readOnly', 'writeOnly'])
        if (node.field?.[key] !== undefined) annotations[key] = node.field[key]
      requirePath(path, types, annotations)
      if (contract?.items) requirePath([...path, null], contract.items)
    }
    if (typeof node.rowKey === 'string' && node.kind === 'array') {
      const rowPath = [...path, null]
      requirePath([...rowPath, node.rowKey], ['string', 'number'])
      rowKeys.push({ path: rowPath, key: node.rowKey })
    }

    for (const [property, binding] of Object.entries(node.bindings ?? {})) {
      if (!isJsonObject(binding) || typeof binding.path !== 'string')
        documentError(
          'invalid_property_binding',
          documentPath(path),
          `Invalid binding for "${property}"`,
        )
      const target = [
        ...(binding.scope === 'parent' ? scope : []),
        ...pointerSegments(binding.path),
      ]
      const slot = contract?.bindings?.[property]
      if (slot && 'rows' in slot) {
        requirePath([...target, null], ['object'])
        for (const { column, types } of slot.rows.columns)
          if (column) requirePath([...target, null, column], types)
      } else {
        const types =
          slot && 'types' in slot
            ? slot.types
            : Array.isArray(binding.types)
              ? binding.types.filter((type): type is DocumentDataType =>
                  documentDataTypes.includes(type as DocumentDataType),
                )
              : undefined
        requirePath(target, types)
      }
    }

    // Adapters declare nested binding dependencies through the same hook used by compilation.
    contract?.compileProps?.(
      contract.normalizeProps?.({ ...node.props }) ?? { ...node.props },
      {
        path: documentPath(path),
        columnSchema: () => undefined,
        resolveBinding(binding, _property, types) {
          const segments = pointerSegments(binding.path)
          const target = [
            ...(binding.scope === 'parent' ? scope : []),
            ...segments,
          ]
          const key = JSON.stringify(target)
          const hint = branchHints.get(key) ?? {
            path: target,
            types: new Set<DocumentDataType>(),
          }
          types.forEach((type) => hint.types.add(type))
          branchHints.set(key, hint)
          return { segments, path: documentPath(target), types }
        },
        report(issue) {
          documentError(
            issue.code,
            issue.path ?? documentPath(path),
            issue.message,
          )
        },
      },
    )

    if (
      node.kind === 'field' &&
      contract?.enumFromOptions !== false &&
      Array.isArray(node.options)
    ) {
      const values = node.options.flatMap((option) =>
        isJsonObject(option) &&
        Object.prototype.hasOwnProperty.call(option, 'value')
          ? [option.value]
          : [],
      )
      if (values.length) {
        const enumValues = [
          ...new Map(
            values.map((value) => [JSON.stringify(value), value]),
          ).values(),
        ] as JsonValue[]
        requirePath(contract?.items ? [...path, null] : path, undefined, {
          enum: enumValues,
        })
      }
    }
  })

  for (const [id, { path, types }] of branchHints)
    if (!requirements.get(id)?.types) requirePath(path, [...types])

  const shapes = new Map<string, ObjectSchema>()
  const root: ObjectSchema = { $schema: schemaVersion }
  for (const { path, types, annotations } of [...requirements.values()].sort(
    (a, b) => a.path.length - b.path.length,
  )) {
    if (!types?.length)
      documentError(
        'missing_data_type',
        documentPath(path),
        'Declare the types for this UI data dependency',
      )
    const compact = types.includes('number')
      ? types.filter((type) => type !== 'integer')
      : types
    const schema: ObjectSchema = path.length ? {} : root
    Object.assign(schema, annotations, {
      type: compact.length === 1 ? compact[0] : compact,
    })
    if (compact.includes('object')) schema.properties = {}
    const parent = shapes.get(JSON.stringify(path.slice(0, -1)))
    const key = path[path.length - 1]
    if (path.length) {
      if (key === null) parent.items = schema
      else parent.properties = { ...parent.properties, [key]: schema }
    }
    shapes.set(JSON.stringify(path), schema)
  }
  for (const { path, key } of rowKeys) {
    const row = shapes.get(JSON.stringify(path))
    row.required = [...new Set([...(row.required ?? []), key])]
  }

  compileFormDocuments({ ui, dataSchema: root }, options)
  return root
}
