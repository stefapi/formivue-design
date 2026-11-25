import {
  isJsonObject,
  jsonPointer,
  pointerSegments,
  valueAt,
} from './document-json'

export const dataSchemaMaps = [
  'properties',
  'patternProperties',
  'dependentSchemas',
  '$defs',
] as const
export const dataSchemaLists = [
  'prefixItems',
  'allOf',
  'anyOf',
  'oneOf',
] as const
export const dataSchemaChildren = [
  'items',
  'contains',
  'unevaluatedItems',
  'additionalProperties',
  'propertyNames',
  'unevaluatedProperties',
  'not',
  'if',
  'then',
  'else',
  'contentSchema',
] as const

export type JsonDataSchema = boolean | object
export type DataSchemaRegistry = Readonly<Record<string, JsonDataSchema>>

export function* dataSchemaLocations(
  schema: unknown,
  path: string[] = [],
): Generator<string[]> {
  if (!isJsonObject(schema) && typeof schema !== 'boolean') return
  yield path
  if (!isJsonObject(schema)) return
  for (const keyword of dataSchemaMaps) {
    const map = schema[keyword]
    if (isJsonObject(map))
      for (const [key, child] of Object.entries(map))
        yield* dataSchemaLocations(child, [...path, keyword, key])
  }
  for (const keyword of dataSchemaLists) {
    const list = schema[keyword]
    if (Array.isArray(list))
      for (const [index, child] of list.entries())
        yield* dataSchemaLocations(child, [...path, keyword, String(index)])
  }
  for (const keyword of dataSchemaChildren)
    yield* dataSchemaLocations(schema[keyword], [...path, keyword])
}

export interface DataSchemaLocation {
  schema: JsonDataSchema
  path: string[]
  document: JsonDataSchema
  uri: string
}

function uri(value: string, base: string) {
  try {
    return new URL(value, base).href
  } catch {
    return undefined
  }
}

/** Index explicit resources and anchors without fetching documents. */
export function dataSchemaResources(
  root: JsonDataSchema,
  additional: DataSchemaRegistry = {},
) {
  const base = 'https://formivue.invalid/'
  const anchors = new Map<string, DataSchemaLocation>()
  const resources = new Map<string, DataSchemaLocation>()
  const locations = new WeakMap<object, DataSchemaLocation>()
  const dynamic = new Map<string, Map<string, DataSchemaLocation>>()
  for (const [origin, document] of [
    [base + '0', root] as const,
    ...Object.entries(additional),
  ]) {
    const scope = new Map<string, string>()
    for (const path of dataSchemaLocations(document)) {
      const schema = valueAt(document, path) as JsonDataSchema
      const inherited =
        scope.get(jsonPointer(path.slice(0, -1))) ??
        scope.get(jsonPointer(path.slice(0, -2))) ??
        origin
      const id =
        isJsonObject(schema) && typeof schema.$id === 'string'
          ? uri(schema.$id, inherited)
          : undefined
      const location = { schema, path, document, uri: id ?? inherited }
      scope.set(jsonPointer(path), location.uri)
      if (!path.length) resources.set(origin, location)
      if (!path.length || id)
        resources.set(location.uri.replace(/#$/u, ''), location)
      if (!isJsonObject(schema)) continue
      locations.set(schema, location)
      for (const key of ['$anchor', '$dynamicAnchor'])
        if (typeof schema[key] === 'string') {
          const name = schema[key] as string
          anchors.set(uri('#' + name, location.uri), location)
          if (key === '$dynamicAnchor') {
            const scoped = dynamic.get(location.uri) ?? new Map()
            scoped.set(name, location)
            dynamic.set(location.uri, scoped)
          }
        }
    }
  }

  const absolute = (origin: object, reference: string) =>
    uri(reference, locations.get(origin)?.uri ?? base + '0')

  function resolve(
    origin: object,
    reference: unknown,
  ): DataSchemaLocation | undefined {
    if (typeof reference !== 'string') return
    const resolved = absolute(origin, reference)
    if (!resolved) return
    const anchor = anchors.get(resolved)
    if (anchor) return anchor
    const split = resolved.indexOf('#')
    const resource = resources.get(
      split < 0 ? resolved : resolved.slice(0, split),
    )
    if (!resource || split < 0 || split === resolved.length - 1) return resource
    try {
      const path = [
        ...resource.path,
        ...pointerSegments(decodeURIComponent(resolved.slice(split + 1))),
      ]
      const schema = valueAt(resource.document, path)
      if (isJsonObject(schema) || typeof schema === 'boolean')
        return { ...resource, schema, path }
    } catch {
      // Incomplete or unknown references are reported by the schema validator.
    }
  }

  return { resolve, absolute, locations, dynamic }
}
