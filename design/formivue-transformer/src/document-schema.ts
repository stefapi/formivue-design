import {
  compileDataValidator,
  dataSchemaResources,
  isJsonObject,
  type DataSchemaRegistry,
} from '@formivue/json-schema'

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

const own = (object: object, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key)
const defined = <T>(value: T | undefined): value is T => value !== undefined
const combine = (members: DataSchema[]): DataSchema | undefined =>
  members.length > 1 ? { allOf: members } : members[0]

function valueTypes(value: unknown) {
  if (typeof value === 'number' && Number.isInteger(value)) return ['integer']
  return [
    value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value,
  ]
}

export function schemaLookup(root: DataSchema, resources?: DataSchemaRegistry) {
  const registry = dataSchemaResources(root, resources)
  const referenced = (schema: Exclude<DataSchema, boolean>) =>
    ['$ref', '$dynamicRef'].flatMap((key) => {
      const value = schema[key]
      const target = registry.resolve(schema, value)
      if (!target) return []
      const anchor = typeof value === 'string' ? value.split('#')[1] : undefined
      if (
        key !== '$dynamicRef' ||
        !isJsonObject(target.schema) ||
        target.schema.$dynamicAnchor !== anchor
      )
        return [target.schema as DataSchema]
      const outer = registry.dynamic
        .get(registry.locations.get(root as object)?.uri)
        ?.get(anchor)
      if (outer) return [outer.schema as DataSchema]
      const candidates = [
        target,
        ...[...registry.dynamic.values()].flatMap((scope) =>
          scope.has(anchor) ? [scope.get(anchor)] : [],
        ),
      ]
      const choices = [
        ...new Set(candidates.map(({ schema }) => schema as DataSchema)),
      ]
      return choices.length === 1 ? choices : [{ anyOf: choices }]
    })
  const mandatory = (schema: Exclude<DataSchema, boolean>) => [
    ...referenced(schema),
    ...(schema.allOf ?? []),
  ]
  const conditional = (schema: Exclude<DataSchema, boolean>) =>
    [
      ...(schema.if !== undefined &&
      (schema.then !== undefined || schema.else !== undefined)
        ? [
            schema.if === true
              ? [schema.then ?? true]
              : schema.if === false
                ? [schema.else ?? true]
                : [schema.then ?? true, schema.else ?? true],
          ]
        : []),
      ...Object.values(
        isJsonObject(schema.dependentSchemas) ? schema.dependentSchemas : {},
      ).map((dependency) => [true, dependency]),
    ] as DataSchema[][]
  const alternatives = (schema: Exclude<DataSchema, boolean>) =>
    [schema.anyOf, schema.oneOf, ...conditional(schema)].filter(defined)
  const conditionalPaths = new WeakSet<object>()

  function possible(
    schema: DataSchema,
    parents = new Set<DataSchema>(),
    branch?: { schema: DataSchema; choice: DataSchema },
  ): string[] {
    if (branch && branch.schema === schema)
      return possible(branch.choice, parents)
    if (schema === false) return []
    if (!schema || schema === true || parents.has(schema)) return types
    const seen = new Set(parents).add(schema)
    const declared = Array.isArray(schema.type)
      ? schema.type
      : schema.type
        ? [schema.type]
        : types
    let result =
      declared.includes('number') && !declared.includes('integer')
        ? [...declared, 'integer']
        : declared
    const constants = own(schema, 'const')
      ? [schema.const]
      : Array.isArray(schema.enum)
        ? schema.enum
        : undefined
    if (constants) {
      const allowed = constants.flatMap(valueTypes)
      result = result.filter((kind) => allowed.includes(kind))
    }
    for (const item of mandatory(schema)) {
      const allowed = possible(item, seen, branch)
      result = result.filter((kind) => allowed.includes(kind))
    }
    for (const branches of alternatives(schema)) {
      const allowed = branches.flatMap((item) => possible(item, seen, branch))
      result = result.filter((kind) => allowed.includes(kind))
    }
    const not = schema.not
    if (
      not === true ||
      (isJsonObject(not) && Object.keys(not).length === 1 && own(not, 'type'))
    ) {
      const excluded = possible(not, seen)
      result = result.filter((kind) => !excluded.includes(kind))
    }
    return result
  }

  const nameValidators = new Map<
    DataSchema,
    ReturnType<typeof compileDataValidator>
  >()
  function rejectsName(rule: DataSchema, key: string) {
    if (rule === false) return true
    if (!rule || rule === true) return false
    try {
      if (!nameValidators.has(rule))
        nameValidators.set(rule, compileDataValidator(rule, { resources }))
      return nameValidators.get(rule)(key).length > 0
    } catch {
      // The document validator owns reference resolution and reports invalid schemas.
      return false
    }
  }

  function directChild(
    schema: Exclude<DataSchema, boolean>,
    key: string | null,
  ): DataSchema | undefined {
    if (
      key === null ||
      (key !== null &&
        /^(0|[1-9]\d*)$/u.test(key) &&
        !own(schema.properties ?? {}, key) &&
        (schema.items !== undefined || schema.prefixItems !== undefined))
    ) {
      const positional = schema.prefixItems ?? []
      if (key !== null) return positional[Number(key)] ?? schema.items
      if (!positional.length) return schema.items
      const max =
        typeof schema.maxItems === 'number' ? schema.maxItems : Infinity
      const items = positional.slice(0, max)
      if (max > positional.length && schema.items !== false)
        items.push(schema.items ?? true)
      return items.length ? { anyOf: items } : undefined
    }
    if (rejectsName(schema.propertyNames as DataSchema, key)) return false
    const matches = own(schema.properties ?? {}, key)
      ? [schema.properties[key]]
      : []
    for (const [pattern, value] of Object.entries(
      schema.patternProperties ?? {},
    )) {
      try {
        if (new RegExp(pattern, 'u').test(key))
          matches.push(value as DataSchema)
      } catch {
        // The dialect validator reports malformed patterns.
      }
    }
    return combine(matches) ?? (schema.additionalProperties as DataSchema)
  }

  function child(
    schema: DataSchema,
    key: string | null,
    parents = new Set<DataSchema>(),
  ): DataSchema | undefined {
    if (schema === false) return false
    if (!schema || schema === true || parents.has(schema)) return undefined
    const seen = new Set(parents).add(schema)
    const matches = [
      directChild(schema, key),
      ...mandatory(schema).map((item) => child(item, key, seen)),
    ].filter(defined)
    for (const [index, branches] of [
      schema.anyOf,
      schema.oneOf,
      ...conditional(schema),
    ].entries()) {
      if (!branches) continue
      const items = branches.map((item) => child(item, key, seen))
      if (items.some(defined)) {
        const candidate = { anyOf: items.map((item) => item ?? true) }
        if (index >= 2 || conditionalPaths.has(schema))
          conditionalPaths.add(candidate)
        matches.push(candidate)
      }
    }
    return combine(matches)
  }

  function* projectedBranches(
    schema: DataSchema,
    seen = new Set<DataSchema>(),
  ): Generator<{ schema: DataSchema; choice: DataSchema }> {
    if (!schema || schema === true || seen.has(schema)) return
    const next = new Set(seen).add(schema)
    for (const choice of conditionalPaths.has(schema) ? schema.anyOf : [])
      yield { schema, choice }
    for (const part of mandatory(schema)) yield* projectedBranches(part, next)
  }

  function constraints(
    schema: DataSchema,
    parents = new Set<DataSchema>(),
  ): Record<string, unknown> {
    if (!schema || schema === true || parents.has(schema)) return {}
    const seen = new Set(parents).add(schema)
    const pieces = [
      ...mandatory(schema).map((item) => constraints(item, seen)),
      schema,
    ]
    const result = Object.assign({}, ...pieces)
    for (const [keys, bound] of [
      [
        [
          'minimum',
          'exclusiveMinimum',
          'minLength',
          'minItems',
          'minProperties',
          'minContains',
        ],
        Math.max,
      ],
      [
        [
          'maximum',
          'exclusiveMaximum',
          'maxLength',
          'maxItems',
          'maxProperties',
          'maxContains',
        ],
        Math.min,
      ],
    ] as const) {
      for (const key of keys) {
        const values = pieces
          .map((piece) => piece[key])
          .filter((value): value is number => typeof value === 'number')
        if (values.length) result[key] = bound(...values)
      }
    }
    const required = pieces.flatMap((piece) =>
      Array.isArray(piece.required) ? piece.required : [],
    )
    if (required.length) result.required = [...new Set(required)]
    return result
  }

  return {
    child,
    at(path: readonly (string | null)[]) {
      return path.reduce((schema, part) => child(schema, part), root)
    },
    possible,
    constraints,
    accepts(schema: DataSchema, expected: readonly string[], nullable = false) {
      const actual = possible(schema)
      const allows = (type: string) =>
        (nullable && type === 'null') ||
        expected.includes(type) ||
        (type === 'integer' && expected.includes('number'))
      return (
        schema !== undefined &&
        actual.some((type) => !nullable || type !== 'null') &&
        actual.every(allows) &&
        [...projectedBranches(schema)].every((branch) => {
          const types = possible(schema, new Set(), branch)
          return types.length > 0 && types.every(allows)
        })
      )
    },
  }
}
