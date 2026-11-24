import {
  compileDataValidator,
  copyJson,
  dataSchemaLocations,
  dataSchemaResources,
  isJsonObject,
  jsonPointer,
  valueAt,
  type JsonObject,
  type JsonValue,
} from '@formivue/json-schema'
import {
  documentError,
  documentPath,
  type DocumentDataPath,
} from './document-paths'
import { schemaLookup, type DataSchema } from './document-schema'
import type { FormDocuments } from './documents'

export interface DocumentPropertyMove {
  path: DocumentDataPath
  to: DocumentDataPath
}

const own = (object: object, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key)
export const pathStartsWith = (
  path: DocumentDataPath,
  prefix: DocumentDataPath,
) =>
  prefix.length <= path.length &&
  prefix.every((part, index) => path[index] === part)

function recordPath(path: DocumentDataPath) {
  return path.slice(0, path.lastIndexOf(null) + 1)
}

function samePath(left: DocumentDataPath, right: DocumentDataPath) {
  return left.length === right.length && pathStartsWith(left, right)
}

export function validateMove({ path, to }: DocumentPropertyMove) {
  for (const address of [path, to]) {
    if (
      !address.length ||
      typeof address[address.length - 1] !== 'string' ||
      address.some(
        (part) =>
          part !== null &&
          (typeof part !== 'string' ||
            !part ||
            /[.[\]*,]|^(?:__proto__|prototype|constructor)$/u.test(part)),
      )
    )
      documentError(
        'invalid_property_move',
        documentPath(address),
        'Choose an addressable property path',
      )
  }
  if (!samePath(recordPath(path), recordPath(to)))
    documentError(
      'cross_record_move',
      documentPath(to),
      'The source and destination must belong to the same record',
    )
  if (
    !samePath(path, to) &&
    (pathStartsWith(to, path) || pathStartsWith(path, to))
  )
    documentError(
      'schema_key_collision',
      documentPath(to),
      'The destination overlaps the source',
    )
}

function moveValues(
  value: JsonValue,
  scope: DocumentDataPath,
  source: string[],
  destination: string[],
  prefix: string[] = [],
) {
  if (scope.length) {
    const [first, ...rest] = scope
    if (first === null && Array.isArray(value))
      value.forEach((row, index) =>
        moveValues(row, rest, source, destination, [...prefix, String(index)]),
      )
    else if (
      typeof first === 'string' &&
      isJsonObject(value) &&
      own(value, first)
    )
      moveValues(value[first], rest, source, destination, [...prefix, first])
    return
  }
  const old = valueAt(value, source.slice(0, -1))
  const oldKey = source[source.length - 1]
  if (!isJsonObject(value)) return
  const present = isJsonObject(old) && own(old, oldKey)
  let target: JsonValue = value
  for (const [depth, key] of destination.entries()) {
    if (!isJsonObject(target))
      documentError(
        'data_key_collision',
        jsonPointer([...prefix, ...destination.slice(0, depth)]),
        'The destination is not an object in this record',
      )
    const full = [...prefix, ...destination.slice(0, depth + 1)]
    if (depth === destination.length - 1) {
      if (own(target, key))
        documentError(
          'data_key_collision',
          jsonPointer(full),
          'The destination already exists in this record',
        )
      if (present) {
        target[key] = old[oldKey]
        delete old[oldKey]
      }
    } else {
      if (!present && !own(target, key)) return
      if (!own(target, key)) target[key] = {}
      target = target[key]
    }
  }
}

export function moveDocumentData(data: JsonObject, move: DocumentPropertyMove) {
  const scope = recordPath(move.path)
  const result = copyJson(data) as JsonObject
  moveValues(
    result,
    scope,
    move.path.slice(scope.length) as string[],
    move.to.slice(scope.length) as string[],
  )
  return result
}

type Schema = Exclude<DataSchema, boolean>
type SchemaFrame = { schema: Schema; path: DocumentDataPath; pointer: string[] }
const branches = ['if', 'then', 'else', 'not', 'allOf', 'anyOf', 'oneOf']
const tagged = ['$id', '$anchor', '$dynamicAnchor']
const matchesPattern = (patterns: unknown, key: string) =>
  isJsonObject(patterns) &&
  Object.keys(patterns).some((pattern) => new RegExp(pattern, 'u').test(key))

function guardedBranch(rule: unknown, key: string): boolean {
  if (Array.isArray(rule))
    return rule.some((branch) => guardedBranch(branch, key))
  if (!isJsonObject(rule)) return false
  return (
    (isJsonObject(rule.properties) && own(rule.properties, key)) ||
    (Array.isArray(rule.required) && rule.required.includes(key)) ||
    matchesPattern(rule.patternProperties, key) ||
    [
      '$ref',
      '$dynamicRef',
      'const',
      'enum',
      'propertyNames',
      'additionalProperties',
      'unevaluatedProperties',
      'minProperties',
      'maxProperties',
      'dependentRequired',
      'dependentSchemas',
    ].some((keyword) => rule[keyword] !== undefined) ||
    branches.some((keyword) => guardedBranch(rule[keyword], key))
  )
}

export function moveDocumentSchema(
  original: FormDocuments['dataSchema'],
  move: DocumentPropertyMove,
) {
  const { path, to } = move
  const result = copyJson(original) as FormDocuments['dataSchema']
  const registry = dataSchemaResources(original)
  const types = schemaLookup(original)
  const createdObjects: string[] = []
  const failRule = (path: DocumentDataPath, keyword: string) =>
    documentError(
      'unsupported_move_rule',
      documentPath(path),
      `The move cannot preserve the "${keyword}" rule at this location`,
    )
  function checkName(frame: SchemaFrame, key: string) {
    const { schema, path } = frame
    if (schema.propertyNames === undefined) return
    let invalid: boolean
    try {
      const validate = compileDataValidator({
        ...(original.$defs ? { $defs: original.$defs } : {}),
        propertyNames: schema.propertyNames,
      })
      invalid = validate({ [key]: null }).length > 0
    } catch {
      failRule(path, 'propertyNames')
    }
    if (invalid)
      documentError(
        'incompatible_property_name',
        documentPath([...path, key]),
        'The destination does not satisfy the property name schema',
      )
  }

  function checkFrame(
    frame: SchemaFrame,
    key: string | null,
    changing: boolean,
  ) {
    const { schema, path } = frame
    if (schema.$ref || schema.$dynamicRef)
      documentError(
        'shared_schema_move',
        documentPath(path),
        'Move a property declared directly in this object. This object uses a schema reference',
      )
    if (path.length && schema.$id !== undefined) failRule(path, '$id')
    if (key === null) {
      for (const keyword of [
        'prefixItems',
        'contains',
        'unevaluatedItems',
        ...branches,
      ])
        if (schema[keyword] !== undefined) failRule(path, keyword)
      return
    }
    for (const keyword of branches)
      if (guardedBranch(schema[keyword], key)) failRule(path, keyword)
    if (matchesPattern(schema.patternProperties, key))
      failRule(path, 'patternProperties')
    for (const [trigger, subschema] of Object.entries(
      schema.dependentSchemas ?? {},
    ))
      if ((changing && trigger === key) || guardedBranch(subschema, key))
        failRule(path, 'dependentSchemas')

    if (!changing) return
    for (const keyword of ['minProperties', 'maxProperties'])
      if (schema[keyword] !== undefined) failRule(path, keyword)
    for (const [trigger, required] of Object.entries(
      schema.dependentRequired ?? {},
    ))
      if (
        trigger === key ||
        (Array.isArray(required) && required.includes(key))
      )
        failRule(path, 'dependentRequired')
    for (const keyword of ['additionalProperties', 'unevaluatedProperties'])
      if (isJsonObject(schema[keyword])) failRule(path, keyword)
  }

  function walk(address: DocumentDataPath, create: boolean): SchemaFrame[] {
    const frames: SchemaFrame[] = [{ schema: result, path: [], pointer: [] }]
    for (const [index, key] of address.entries()) {
      const previous = frames[frames.length - 1]
      const schema = previous.schema
      const next = address.slice(0, index + 1)
      const requiredType = key === null ? 'array' : 'object'
      const known = types.at(previous.path)
      if (
        !createdObjects.includes(documentPath(previous.path)) &&
        !types.accepts(known, [requiredType], true)
      )
        documentError(
          'invalid_move_parent',
          documentPath(previous.path),
          `Expected a ${requiredType} at this location`,
        )
      checkFrame(
        previous,
        key,
        key !== null && !own(schema.properties ?? {}, key),
      )
      let child = key === null ? schema.items : schema.properties?.[key]
      if (
        child === undefined &&
        create &&
        key !== null &&
        address[index + 1] !== null
      ) {
        checkName(previous, key)
        schema.properties ??= {}
        child = schema.properties[key] = { type: 'object', properties: {} }
        createdObjects.push(documentPath(next))
      }
      if (!isJsonObject(child))
        documentError(
          'invalid_move_parent',
          documentPath(next),
          'The parent must be an object schema defined at this location',
        )
      frames.push({
        schema: child,
        path: next,
        pointer: [
          ...previous.pointer,
          ...(key === null ? ['items'] : ['properties', key]),
        ],
      })
    }
    const last = frames[frames.length - 1]
    if (
      !createdObjects.includes(documentPath(last.path)) &&
      !types.accepts(types.at(last.path), ['object'], true)
    )
      documentError(
        'invalid_move_parent',
        documentPath(last.path),
        'Expected an object at this location',
      )
    return frames
  }

  const sourceFrames = walk(path.slice(0, -1), false)
  const source = sourceFrames[sourceFrames.length - 1]
  const sourceKey = path[path.length - 1] as string
  const targetKey = to[to.length - 1] as string
  checkFrame(source, sourceKey, true)
  if (!own(source.schema.properties ?? {}, sourceKey))
    documentError(
      'missing_data_path',
      documentPath(path),
      'The property is missing from this object schema',
    )
  const property = source.schema.properties[sourceKey]
  if (
    [...dataSchemaLocations(property)].some((pointer) => {
      const node = valueAt(property, pointer)
      return isJsonObject(node) && tagged.some((keyword) => own(node, keyword))
    })
  )
    failRule(path, 'schema identifiers')

  const targetFrames = walk(to.slice(0, -1), true)
  const target = targetFrames[targetFrames.length - 1]
  if (own(target.schema.properties ?? {}, targetKey))
    documentError(
      'schema_key_collision',
      documentPath(to),
      'The destination already exists in the data schema',
    )
  checkFrame(target, targetKey, true)
  checkName(target, targetKey)

  const common = source.path.findIndex(
    (part, index) => part !== target.path[index],
  )
  const sharedDepth =
    common < 0 ? Math.min(source.path.length, target.path.length) : common
  if (source.schema.required?.includes(sourceKey)) {
    for (let depth = sharedDepth; depth < source.path.length; depth++) {
      if (
        !sourceFrames[depth].schema.required?.includes(
          source.path[depth] as string,
        )
      )
        failRule(sourceFrames[depth].path, 'required')
    }
    source.schema.required = source.schema.required.filter(
      (key) => key !== sourceKey,
    )
    if (!source.schema.required.length) delete source.schema.required
    for (let depth = sharedDepth; depth < to.length; depth++) {
      const schema = targetFrames[depth].schema
      schema.required = [
        ...new Set([...(schema.required ?? []), to[depth] as string]),
      ]
    }
  }

  // Rebase instance-valued annotations only where both paths share the same scope.
  for (const frame of new Map(
    [...sourceFrames, ...targetFrames].map((frame) => [frame.schema, frame]),
  ).values()) {
    const within =
      pathStartsWith(path, frame.path) && pathStartsWith(to, frame.path)
    for (const keyword of ['const', 'default', 'enum', 'examples']) {
      const value = frame.schema[keyword]
      if (value === undefined) continue
      if (!within) failRule(frame.path, keyword)
      const from = path.slice(frame.path.length)
      const destination = to.slice(frame.path.length)
      const scope = recordPath(from)
      const rebase = (sample: JsonValue) =>
        moveValues(
          sample,
          scope,
          from.slice(scope.length) as string[],
          destination.slice(scope.length) as string[],
          frame.path.map((part) => part ?? '*'),
        )
      if (
        (keyword === 'enum' || keyword === 'examples') &&
        Array.isArray(value)
      )
        value.forEach(rebase)
      else rebase(value as JsonValue)
    }
  }

  delete source.schema.properties[sourceKey]
  target.schema.properties ??= {}
  target.schema.properties[targetKey] = property

  const fromPointer = [...source.pointer, 'properties', sourceKey]
  const toPointer = [...target.pointer, 'properties', targetKey]
  for (const pointer of dataSchemaLocations(original)) {
    const node = valueAt(original, pointer)
    if (!isJsonObject(node)) continue
    for (const keyword of ['$ref', '$dynamicRef']) {
      const resolved = registry.resolve(node, node[keyword])
      if (
        resolved?.document !== original ||
        !pathStartsWith(resolved.path, fromPointer)
      )
        continue
      if (
        keyword === '$dynamicRef' ||
        typeof node[keyword] !== 'string' ||
        !node[keyword].startsWith('#/')
      )
        failRule(path, keyword)
      const next = pathStartsWith(pointer, fromPointer)
        ? [...toPointer, ...pointer.slice(fromPointer.length)]
        : pointer
      const schema = valueAt(result, next) as JsonObject
      schema[keyword] =
        '#' +
        jsonPointer([...toPointer, ...resolved.path.slice(fromPointer.length)])
    }
  }
  return { dataSchema: result, createdObjects }
}
