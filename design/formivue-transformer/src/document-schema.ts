import { valueAt, pointerSegments } from '@formivue/json-schema'

export type DataSchema =
  | boolean
  | {
      type?: string | string[]
      properties?: Record<string, DataSchema>
      items?: DataSchema
      prefixItems?: DataSchema[]
      required?: string[]
      $ref?: string
      allOf?: DataSchema[]
      anyOf?: DataSchema[]
      oneOf?: DataSchema[]
      [keyword: string]: unknown
    }

const types = [
  'object',
  'array',
  'string',
  'integer',
  'number',
  'boolean',
  'null',
]

export function schemaLookup(root: DataSchema) {
  const reference = (ref: string) =>
    ref === '#'
      ? root
      : ref?.startsWith('#/')
        ? (valueAt(
            root,
            pointerSegments(decodeURIComponent(ref.slice(1))),
          ) as DataSchema)
        : undefined

  function possible(
    schema: DataSchema,
    parents = new Set<DataSchema>(),
  ): string[] {
    if (schema === false) return []
    if (!schema || schema === true || parents.has(schema)) return types
    const seen = new Set(parents).add(schema)
    const names = Array.isArray(schema.type)
      ? schema.type
      : schema.type
        ? [schema.type]
        : types
    let result =
      names.includes('number') && !names.includes('integer')
        ? [...names, 'integer']
        : names
    const mandatory = [reference(schema.$ref), ...(schema.allOf ?? [])].filter(
      (item) => item !== undefined,
    )
    for (const item of mandatory) {
      const allowed = possible(item, seen)
      result = result.filter((name) => allowed.includes(name))
    }
    for (const alternatives of [schema.anyOf, schema.oneOf]) {
      if (!alternatives) continue
      const allowed = alternatives.flatMap((item) => possible(item, seen))
      result = result.filter((name) => allowed.includes(name))
    }
    return result
  }

  function child(
    schema: DataSchema,
    key: string | null,
    parents = new Set<DataSchema>(),
  ): DataSchema | undefined {
    if (!schema || schema === true || parents.has(schema)) return undefined
    const seen = new Set(parents).add(schema)
    const index =
      key !== null && /^(0|[1-9]\d*)$/u.test(key) ? Number(key) : undefined
    const direct =
      key === null
        ? schema.items
        : schema.properties &&
            Object.prototype.hasOwnProperty.call(schema.properties, key)
          ? schema.properties[key]
          : index !== undefined &&
              (schema.type === 'array' ||
                (Array.isArray(schema.type) && schema.type.includes('array')))
            ? (schema.prefixItems?.[index] ?? schema.items)
            : undefined
    const matches = [
      direct,
      ...[reference(schema.$ref), ...(schema.allOf ?? [])].map((item) =>
        child(item, key, seen),
      ),
    ].filter((item) => item !== undefined)
    for (const alternatives of [schema.anyOf, schema.oneOf]) {
      if (!alternatives) continue
      const items = alternatives.map((item) => child(item, key, seen))
      if (items.every((item) => item !== undefined))
        matches.push({ anyOf: items })
    }
    return matches.length > 1 ? { allOf: matches } : matches[0]
  }

  function constraints(
    schema: DataSchema,
    parents = new Set<DataSchema>(),
  ): Record<string, unknown> {
    if (!schema || schema === true || parents.has(schema)) return {}
    const seen = new Set(parents).add(schema)
    return Object.assign(
      {},
      constraints(reference(schema.$ref), seen),
      ...(schema.allOf ?? []).map((item) => constraints(item, seen)),
      schema,
    )
  }

  return {
    child,
    at(path: readonly (string | null)[]) {
      return path.reduce(childStep, root)
      function childStep(schema: DataSchema, key: string | null) {
        return child(schema, key)
      }
    },
    possible,
    constraints,
    accepts(schema: DataSchema, expected: readonly string[], nullable = false) {
      const actual = possible(schema).filter(
        (type) => !nullable || type !== 'null',
      )
      return (
        schema !== undefined &&
        actual.length > 0 &&
        actual.every(
          (kind) =>
            expected.includes(kind) ||
            (kind === 'integer' && expected.includes('number')),
        )
      )
    },
  }
}
