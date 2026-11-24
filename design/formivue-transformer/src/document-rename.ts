import {
  compileDataValidator,
  copyJson,
  isJsonObject,
  jsonPointer,
  pointerSegments,
  valueAt,
  type JsonObject,
  type JsonValue,
} from '@formivue/json-schema'
import {
  standardDocumentContracts,
  type DocumentContractOptions,
} from './document-contracts'
import { inlineBinding } from './document-migration'
import {
  documentError,
  documentPath,
  visitUiNodes,
  type DocumentDataPath,
} from './document-paths'
import { schemaLookup, type DataSchema } from './document-schema'
import type { DataBinding, FormDocuments, UiDocument } from './documents'

export interface DocumentPropertyRename {
  path: DocumentDataPath
  key: string
}

const has = (value: object, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key)
const index = /^(0|[1-9]\d*)$/u

export function renameDataPath(
  path: DocumentDataPath,
  rename: DocumentPropertyRename,
): DocumentDataPath {
  if (
    path.length < rename.path.length ||
    !rename.path.every(
      (part, i) =>
        part === path[i] || (part === null && index.test(path[i] ?? '')),
    )
  )
    return path
  const last = rename.path.length - 1
  return [...path.slice(0, last), rename.key, ...path.slice(last + 1)]
}

function renameValue(
  value: JsonValue,
  path: DocumentDataPath,
  key: string,
  scope: string[] = [],
) {
  const [part, ...rest] = path
  if (part === null && Array.isArray(value)) {
    value.forEach((item, i) =>
      renameValue(item, rest, key, [...scope, String(i)]),
    )
  } else if (part !== null && isJsonObject(value)) {
    const object = value as JsonObject
    if (rest.length) {
      if (has(object, part))
        renameValue(object[part], rest, key, [...scope, part])
    } else {
      if (has(object, key))
        documentError(
          'data_key_collision',
          jsonPointer([...scope, key]),
          'The destination already exists in the data',
        )
      if (has(object, part)) {
        object[key] = object[part]
        delete object[part]
      }
    }
  }
}

export function renameDocumentSchema(
  original: FormDocuments['dataSchema'],
  { path, key }: DocumentPropertyRename,
): FormDocuments['dataSchema'] {
  const lookup = schemaLookup(original)
  const source = documentPath(path)
  for (let depth = 0; depth < path.length; depth++) {
    const scope = path.slice(0, depth)
    const type = path[depth] === null ? 'array' : 'object'
    if (!lookup.accepts(lookup.at(scope), [type], true))
      documentError(
        'invalid_property_rename',
        documentPath(scope),
        'Use a property path with null at each repeated array item',
      )
  }
  if (lookup.at(path) === undefined)
    documentError(
      'missing_data_path',
      source,
      'The property is missing from the data schema',
    )
  const destination = [...path.slice(0, -1), key]
  if (lookup.at(destination) !== undefined)
    documentError(
      'schema_key_collision',
      documentPath(destination),
      'The destination already exists in the data schema',
    )

  // References are copied into the affected occurrence so other users of a definition keep their schema.
  function rewrite(
    input: DataSchema,
    remaining: DocumentDataPath,
    references: ReadonlySet<string> = new Set(),
  ): DataSchema {
    if (!input || input === true) return input
    const schema = { ...input }
    const [part, ...rest] = remaining
    const atParent = rest.length === 0
    const replaceName = (name: string) => (name === part ? key : name)
    const setMap = (
      map: unknown,
      apply: (value: unknown, name: string) => unknown,
      renameKeys = false,
    ) => {
      if (!isJsonObject(map)) return map
      if (renameKeys && has(map, key))
        documentError(
          'schema_key_collision',
          documentPath(destination),
          'The destination already exists in a schema branch',
        )
      return Object.fromEntries(
        Object.entries(map).map(([name, value]) => [
          renameKeys ? replaceName(name) : name,
          apply(value, name),
        ]),
      )
    }

    for (const keyword of ['allOf', 'anyOf', 'oneOf'] as const) {
      if (Array.isArray(schema[keyword]))
        schema[keyword] = schema[keyword].map((branch) =>
          rewrite(branch, remaining, references),
        )
    }
    for (const keyword of ['if', 'then', 'else', 'not'] as const) {
      if (schema[keyword] !== undefined)
        schema[keyword] = rewrite(
          schema[keyword] as DataSchema,
          remaining,
          references,
        )
    }
    if (schema.dependentSchemas)
      schema.dependentSchemas = setMap(
        schema.dependentSchemas,
        (value) => rewrite(value as DataSchema, remaining, references),
        atParent,
      )
    if (schema.$ref) {
      const ref = schema.$ref
      if (references.has(ref) || !ref.startsWith('#/'))
        documentError(
          'unsupported_schema_reference',
          source,
          'The schema reference cannot be rewritten at this location',
        )
      const target = valueAt(
        original,
        pointerSegments(decodeURIComponent(ref.slice(1))),
      ) as DataSchema
      if (
        target === undefined ||
        (typeof target === 'object' &&
          ['$id', '$anchor', '$dynamicAnchor'].some((keyword) =>
            has(target, keyword),
          ))
      )
        documentError(
          'unsupported_schema_reference',
          source,
          'The schema reference cannot be copied for this property',
        )
      schema.allOf = [
        rewrite(target, remaining, new Set([...references, ref])),
        ...(schema.allOf ?? []),
      ]
      delete schema.$ref
    }
    if (schema.$dynamicRef)
      documentError(
        'unsupported_schema_reference',
        source,
        'A dynamic reference cannot be rewritten at this location',
      )

    for (const keyword of ['default', 'const'] as const) {
      if (schema[keyword] === undefined) continue
      const value = copyJson(schema[keyword])
      renameValue(value, remaining, key)
      schema[keyword] = value
    }
    for (const keyword of ['examples', 'enum'] as const) {
      const values = schema[keyword]
      if (!Array.isArray(values)) continue
      schema[keyword] = values.map((value) => {
        const copy = copyJson(value)
        renameValue(copy, remaining, key)
        return copy
      })
    }

    if (part === null) {
      if (schema.items !== undefined)
        schema.items = rewrite(schema.items, rest, references)
      if (schema.prefixItems)
        schema.prefixItems = schema.prefixItems.map((item) =>
          rewrite(item, rest, references),
        )
      if (schema.contains !== undefined)
        schema.contains = rewrite(
          schema.contains as DataSchema,
          rest,
          references,
        )
    } else {
      if (atParent) {
        if (schema.propertyNames !== undefined) {
          const validate = compileDataValidator({
            $defs: original.$defs,
            type: 'object',
            propertyNames: schema.propertyNames,
          })
          if (validate({ [key]: null }).length)
            documentError(
              'incompatible_property_name',
              documentPath(destination),
              'The destination does not satisfy the property name schema',
            )
        }
        if (Array.isArray(schema.required))
          schema.required = schema.required.map(replaceName)
        if (schema.dependentRequired)
          schema.dependentRequired = setMap(
            schema.dependentRequired,
            (values) =>
              Array.isArray(values) ? values.map(replaceName) : values,
            true,
          )
      }
      if (schema.properties)
        schema.properties = setMap(
          schema.properties,
          (value, name) =>
            !atParent && name === part
              ? rewrite(value as DataSchema, rest, references)
              : value,
          atParent,
        ) as typeof schema.properties
      if (isJsonObject(schema.patternProperties)) {
        for (const pattern of Object.keys(schema.patternProperties)) {
          const matcher = new RegExp(pattern, 'u')
          if (
            atParent
              ? matcher.test(part) !== matcher.test(key)
              : matcher.test(part)
          )
            documentError(
              'incompatible_property_pattern',
              source,
              'The rename affects a pattern property rule',
            )
        }
      }
    }
    return schema
  }

  return rewrite(original, path) as FormDocuments['dataSchema']
}

export function renameDocumentData(
  data: JsonObject,
  { path, key }: DocumentPropertyRename,
): JsonObject {
  const result = copyJson(data) as JsonObject
  renameValue(result, path, key)
  return result
}

export function renameDocumentUi(
  ui: UiDocument,
  rename: DocumentPropertyRename,
  options: DocumentContractOptions,
): { ui: UiDocument; componentIds: string[] } {
  const result = copyJson(ui) as unknown as UiDocument
  const contracts = options.contracts ?? standardDocumentContracts
  const componentIds: string[] = []

  visitUiNodes(result, (node, scope, path) => {
    const nextScope = renameDataPath(scope, rename)
    const nextPath = renameDataPath(path, rename)
    const originalBindings = node.bindings
    const rewriteBinding = (binding: DataBinding) => {
      const base = binding.scope === 'parent' ? scope : []
      const bound = [...base, ...pointerSegments(binding.path)]
      const next = renameDataPath(bound, rename)
      return next === bound
        ? binding
        : { ...binding, path: jsonPointer(next.slice(base.length) as string[]) }
    }
    let changed = false
    if (node.bind !== undefined) {
      const bind = jsonPointer(nextPath.slice(nextScope.length) as string[])
      if (bind !== node.bind) {
        node.bind = bind
        changed = true
      }
    }
    for (const [property, binding] of Object.entries(originalBindings ?? {})) {
      const next = rewriteBinding(binding)
      if (next !== binding) {
        node.bindings = { ...node.bindings, [property]: next }
        changed = true
      }
    }
    if (node.rowKey !== undefined) {
      const rowKey = [...path, null, node.rowKey]
      const next = renameDataPath(rowKey, rename)[rowKey.length - 1]
      if (next !== node.rowKey) {
        if (node.props?.rowKey === node.rowKey) node.props.rowKey = next
        node.rowKey = next
        changed = true
      }
    }
    const contract = contracts.resolve(node.component, node.props)
    if (contract?.renameProps && node.props) {
      const props = contract.renameProps(node.props, {
        renameBinding: rewriteBinding,
        renameColumn(property, column) {
          const binding = originalBindings?.[property]
          if (!binding) return column
          const base = binding.scope === 'parent' ? scope : []
          const path = [...base, ...pointerSegments(binding.path), null, column]
          return renameDataPath(path, rename)[path.length - 1]
        },
      })
      if (props !== node.props) {
        node.props = props
        changed = true
      }
    }
    function rewriteExpressions(value: JsonValue): JsonValue {
      if (typeof value === 'string' && value.includes('{{')) {
        const pointer = inlineBinding(value)
        if (pointer) {
          const next = rewriteBinding({ path: pointer })
          if (next.path !== pointer) {
            changed = true
            return `{{ $form.getValuesIn(${JSON.stringify(pointerSegments(next.path))}) }}`
          }
        } else if (/\$(?:form|values|self|deps|document)\b/u.test(value)) {
          documentError(
            'unresolved_ui_expression',
            documentPath(path),
            'A UI expression needs an explicit binding before a data path can be renamed',
          )
        }
      } else if (Array.isArray(value)) return value.map(rewriteExpressions)
      else if (isJsonObject(value))
        return Object.fromEntries(
          Object.entries(value).map(([key, item]) => [
            key,
            rewriteExpressions(item as JsonValue),
          ]),
        )
      return value
    }
    if (node.props) node.props = rewriteExpressions(node.props) as JsonObject
    if (node.field) {
      const reactions = node.field['x-reactions']
      if (reactions && JSON.stringify(reactions).includes('"dependencies"'))
        documentError(
          'unresolved_ui_expression',
          documentPath(path),
          'A UI reaction needs explicit bindings before a data path can be renamed',
        )
      node.field = rewriteExpressions(node.field) as JsonObject
    }
    if (changed) componentIds.push(node.id)
  })

  return { ui: result, componentIds }
}
