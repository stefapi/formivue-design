import {
  compileSchema,
  draft2020,
  extendDraft,
  type JsonSchemaValidator,
  type JsonSchema,
} from 'json-schema-library'
import { fullFormats } from 'ajv-formats/dist/formats.js'
import {
  DocumentValidationError,
  isJsonObject,
  jsonPointer,
  valueAt,
  pointerSegments,
  type DataSchemaValidationOptions,
  type DocumentIssue,
  type JsonValue,
} from './document-data'
import {
  dataSchemaLocations,
  type DataSchemaRegistry,
  type JsonDataSchema,
} from './document-schema-resources'

const namespace = 'https://json-schema.org/draft/2020-12/vocab/'
const dialectKeywords: Record<string, string> = {
  'missing-dependency-error': 'dependentRequired',
  'required-property-error': 'required',
  'no-additional-properties-error': 'additionalProperties',
  'additional-properties-error': 'additionalProperties',
  'forbidden-property-error': 'additionalProperties',
  'unevaluated-property-error': 'unevaluatedProperties',
  'invalid-property-name-error': 'propertyNames',
  'additional-items-error': 'items',
  'contains-min-error': 'contains',
  'contains-max-error': 'contains',
  'multiple-one-of-error': 'oneOf',
  'format-validation-error': 'format',
  'min-length-one-error': 'minLength',
  'min-items-one-error': 'minItems',
}
const vocabularies: Record<string, string[]> = {
  core: ['$ref', '$defs'],
  applicator: [
    'allOf',
    'anyOf',
    'oneOf',
    'if',
    'not',
    'dependentSchemas',
    'properties',
    'patternProperties',
    'additionalProperties',
    'propertyNames',
    'items',
    'prefixItems',
    'contains',
  ],
  validation: [
    'type',
    'enum',
    'const',
    'multipleOf',
    'maximum',
    'exclusiveMaximum',
    'minimum',
    'exclusiveMinimum',
    'maxLength',
    'minLength',
    'pattern',
    'maxItems',
    'minItems',
    'uniqueItems',
    'maxProperties',
    'minProperties',
    'required',
    'dependentRequired',
  ],
  unevaluated: ['unevaluatedProperties', 'unevaluatedItems'],
  'meta-data': ['deprecated'],
  'format-annotation': ['format'],
  'format-assertion': ['format'],
  content: [],
}

function decimal(value: number) {
  const [digits, exponent = '0'] = String(value).split('e')
  const [whole, fraction = ''] = digits.split('.')
  return {
    coefficient: BigInt(whole + fraction),
    exponent: Number(exponent) - fraction.length,
  }
}

function divides(value: number, multiple: number) {
  const left = decimal(value)
  const right = decimal(multiple)
  const exponent = Math.min(left.exponent, right.exponent)
  return (
    (left.coefficient * 10n ** BigInt(left.exponent - exponent)) %
      (right.coefficient * 10n ** BigInt(right.exponent - exponent)) ===
    0n
  )
}

const formats = Object.fromEntries(
  Object.entries(fullFormats).map(([name, value]) => {
    const validate: JsonSchemaValidator = ({ data, node, pointer }) => {
      const format =
        value instanceof RegExp || typeof value === 'function'
          ? value
          : typeof value === 'object'
            ? value.validate
            : undefined
      if (!format) return
      const type =
        typeof value === 'object' && !(value instanceof RegExp)
          ? (value.type ?? 'string')
          : 'string'
      if (typeof data !== type) return
      const valid =
        format instanceof RegExp
          ? format.test(String(data))
          : (format as (data: unknown) => boolean)(data)
      if (!valid)
        return node.createError('format-validation-error', {
          pointer,
          schema: node.schema,
          value: data,
          format: name,
        })
    }
    return [name, validate]
  }),
)

const dialect = extendDraft(draft2020, {
  formats,
  keywords: [
    {
      ...draft2020.keywords.find(({ keyword }) => keyword === 'multipleOf'),
      validate({ node, pointer, data }) {
        if (typeof data !== 'number' || !Number.isFinite(data)) return
        const multiple = node.schema.multipleOf
        if (multiple > 0 && !divides(data, multiple))
          return node.createError('multiple-of-error', {
            multipleOf: multiple,
            pointer,
            schema: node.schema,
            value: data,
          })
      },
    },
  ],
  errors: { 'format-validation-error': 'must match format "{{format}}"' },
})

export function needsDialectEvaluation(
  schema: JsonDataSchema,
  resources: DataSchemaRegistry,
) {
  if (Object.keys(resources).length) return true
  for (const path of dataSchemaLocations(schema)) {
    const node = valueAt(schema, path)
    if (!isJsonObject(node)) continue
    if (
      (path.length > 0 && typeof node.$id === 'string') ||
      [
        '$dynamicRef',
        'unevaluatedItems',
        'unevaluatedProperties',
        'multipleOf',
      ].some((keyword) => node[keyword] !== undefined) ||
      (Array.isArray(node.enum) && !node.enum.length) ||
      (isJsonObject(node.properties) &&
        Object.prototype.hasOwnProperty.call(node.properties, '__proto__'))
    )
      return true
  }
  return false
}

/** Evaluates vocabularies whose annotation or dynamic-scope behaviour AJV 8
 * does not model. The document manager keeps AJV's metaschema and diagnostics. */
export function dialectValidator(
  schema: JsonDataSchema,
  resources: DataSchemaRegistry,
  assertFormats: boolean,
  {
    includeConstantValues,
    includeValidationDetails,
  }: DataSchemaValidationOptions,
) {
  const drafts = Object.entries(resources).flatMap(([uri, meta]) => {
    if (!isJsonObject(meta) || !isJsonObject(meta.$vocabulary)) return []
    const supported = new Set<string>()
    for (const [id, required] of Object.entries(meta.$vocabulary)) {
      const vocabulary =
        id.startsWith(namespace) && vocabularies[id.slice(namespace.length)]
      if (!vocabulary && required)
        throw new DocumentValidationError([
          {
            path: '/$vocabulary',
            code: 'unsupported_schema_vocabulary',
            message: `Unsupported required vocabulary ${id}`,
          },
        ])
      if (vocabulary) vocabulary.forEach((keyword) => supported.add(keyword))
    }
    const ids = [uri, meta.$id].filter(
      (id): id is string => typeof id === 'string',
    )
    return [
      {
        ...dialect,
        $schemaRegEx:
          '^(?:' +
          ids
            .map((id) => id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'))
            .join('|') +
          ')$',
        keywords: dialect.keywords.filter(({ keyword }) =>
          supported.has(keyword),
        ),
      },
    ]
  })
  const node = compileSchema(schema as JsonSchema, {
    drafts: [...drafts, dialect],
    formatAssertion: assertFormats,
    throwOnInvalidRef: true,
  })
  for (const [uri, resource] of Object.entries(resources))
    node.addRemoteSchema(uri, resource as JsonSchema)

  return (value: unknown): DocumentIssue[] => {
    try {
      const result = node.validate(value)
      return result.errors.map(({ code, data, message }) => {
        const path =
          typeof data.pointer === 'string'
            ? data.pointer.replace(/^#/u, '')
            : ''
        const key =
          code === 'required-property-error'
            ? data.key
            : code === 'invalid-property-name-error'
              ? data.property
              : data.missingProperty
        const messages: Record<string, () => string> = {
          'required-property-error': () =>
            'must have required property ' + JSON.stringify(key),
          'missing-dependency-error': () =>
            'must have required property ' + JSON.stringify(key),
          'minimum-error': () => 'must be >= ' + data.minimum,
          'maximum-error': () => 'must be <= ' + data.maximum,
          'min-length-error': () =>
            'must NOT have fewer than ' + data.minLength + ' characters',
          'max-length-error': () =>
            'must NOT have more than ' + data.maxLength + ' characters',
          'type-error': () => 'must be ' + data.expected,
          'pattern-error': () =>
            'must match pattern ' + JSON.stringify(data.pattern),
        }
        const issuePath =
          typeof key === 'string' ? path + jsonPointer([key]) : path
        return {
          path: issuePath,
          message:
            (typeof code === 'string' ? messages[code]?.() : undefined) ??
            message,
          ...(includeConstantValues && code === 'const-error'
            ? {
                constantMismatch: {
                  expected: data.expected as JsonValue,
                  actual: data.value,
                },
              }
            : {}),
          ...(includeValidationDetails && typeof code === 'string'
            ? {
                validationDetails: dialectDetails(code, data, value, issuePath),
              }
            : {}),
        }
      })
    } catch (cause) {
      throw new DocumentValidationError([{ path: '', message: String(cause) }])
    }
  }
}

function dialectDetails(
  code: string,
  data: Record<string, unknown>,
  value: unknown,
  path: string,
) {
  const keyword =
    dialectKeywords[code] ??
    code
      .replace(/-error$/u, '')
      .replace(/-([a-z])/gu, (_, letter: string) => letter.toUpperCase())
  const schema = isJsonObject(data.schema) ? data.schema : {}
  const propertyRule = schema.propertyNames
  if (keyword === 'propertyNames' && isJsonObject(propertyRule)) {
    if (Array.isArray(propertyRule.enum))
      return {
        keyword: 'enum',
        expected: propertyRule.enum,
        actual: data.property,
      }
    if (propertyRule.const !== undefined)
      return {
        keyword: 'const',
        expected: propertyRule.const,
        actual: data.property,
      }
  }
  const expected =
    keyword === 'contains'
      ? {
          minContains: schema.minContains ?? 1,
          maxContains: schema.maxContains,
          itemSchema: schema.contains,
        }
      : keyword === 'format'
        ? data.format
        : schema[keyword]
  return {
    keyword,
    expected,
    actual:
      keyword === 'propertyNames'
        ? data.property
        : valueAt(value, pointerSegments(path)),
  }
}
