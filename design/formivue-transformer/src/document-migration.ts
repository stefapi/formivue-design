import {
  copyJson,
  DocumentValidationError,
  isJsonObject,
  jsonPointer,
  type ISchema,
  type JsonObject,
  type JsonValue,
} from '@formivue/json-schema'
import { type FormDocuments, type UiDocumentNode } from './documents'
import { displayValueProps, rowColumns, widgetData } from './document-contracts'
import { schemaLookup, type DataSchema } from './document-schema'
import type { IFormivueSchema } from './index'
import { FormPath } from '@formivue/core'

type ObjectSchema = Exclude<DataSchema, boolean>
type LegacySchema = ISchema & { 'x-designable-id'?: string }
const schemaVersion = 'https://json-schema.org/draft/2020-12/schema'
const dataKeywords = [
  'const',
  'format',
  'pattern',
  'multipleOf',
  'maximum',
  'minimum',
  'exclusiveMaximum',
  'exclusiveMinimum',
  'maxLength',
  'minLength',
  'maxItems',
  'minItems',
  'uniqueItems',
  'maxProperties',
  'minProperties',
  'additionalProperties',
  'allOf',
  'anyOf',
  'oneOf',
  'not',
]

function clean<T>(value: T): T {
  return copyJson(value, true) as T
}

function infer(values: unknown[]): ObjectSchema {
  const schemas: ObjectSchema[] = []
  const typed = new Map<string, unknown[]>()
  for (const value of values) {
    const type = Array.isArray(value)
      ? 'array'
      : value === null
        ? 'null'
        : typeof value
    const group = typed.get(type) ?? []
    group.push(value)
    typed.set(type, group)
  }
  for (const [type, items] of typed) {
    if (type === 'object') {
      const properties: Record<string, DataSchema> = Object.fromEntries(
        [...new Set(items.flatMap((item) => Object.keys(item)))].map((key) => [
          key,
          infer(
            items.flatMap((item) =>
              Object.prototype.hasOwnProperty.call(item, key)
                ? [item[key]]
                : [],
            ),
          ),
        ]),
      )
      schemas.push({ type, properties })
    } else if (type === 'array') {
      schemas.push({ type, items: infer(items.flat()) })
    } else {
      schemas.push({ type })
    }
  }
  return schemas.length > 1 ? { anyOf: schemas } : (schemas[0] ?? {})
}

function inlineBinding(value: string): string | undefined {
  const path = value.match(
    /^\s*\{\{\s*\$form\.getValuesIn\((\[[\s\S]*\])\)\s*\}\}\s*$/u,
  )?.[1]
  if (path) {
    try {
      const segments = JSON.parse(path)
      if (
        Array.isArray(segments) &&
        segments.every((key) => typeof key === 'string')
      )
        return jsonPointer(segments)
    } catch {
      return
    }
  }
  const name = value.match(/^\s*\{\{\s*\$values\.([\w.]+)\s*\}\}\s*$/u)?.[1]
  if (name) return jsonPointer(name.split('.'))
}

function migrateFieldSchema(
  field: LegacySchema,
  node: UiDocumentNode,
): ObjectSchema {
  const expected = widgetData(node.component, node.props)
  const legacyTypes = {
    'string[]': ['array'],
    'Array<object>': ['array'],
    'Array<string | number>': ['array'],
    'string | number': ['string', 'number'],
  }
  const expectedTypes = expected?.types ?? []
  const type =
    node.kind === 'object' || node.kind === 'array'
      ? [node.kind]
      : expectedTypes.length
        ? expectedTypes
        : (legacyTypes[field.type] ?? (field.type ? [field.type] : []))
  const schema: ObjectSchema = Object.fromEntries(
    dataKeywords.flatMap((name) =>
      field[name] === undefined ? [] : [[name, field[name]]],
    ),
  )
  if (type.length) schema.type = type.length === 1 ? type[0] : type
  if (field.items && !node.item && !Array.isArray(field.items))
    schema.items = clean(field.items) as DataSchema
  if (expected?.items && !schema.items)
    schema.items = {
      type: expected.items.length === 1 ? expected.items[0] : expected.items,
    }
  if (Array.isArray(field.enum)) {
    const values = field.enum.map((option) =>
      isJsonObject(option) ? option.value : option,
    )
    if (field.enum.some(isJsonObject))
      node.options = clean(
        field.enum.map((option) =>
          isJsonObject(option) ? option : { label: option, value: option },
        ),
      ) as JsonObject[]
    // Cascader's tree contains paths. Its options are metadata for the widget.
    if (
      node.component !== 'Cascader' &&
      node.component !== 'TreeSelect' &&
      values.length
    ) {
      if (schema.type === 'array')
        schema.items = { ...(schema.items as ObjectSchema), enum: values }
      else schema.enum = values
    }
  }
  return clean(schema)
}

export function splitFormSchema(
  legacy: IFormivueSchema,
  values?: JsonObject,
): FormDocuments {
  const dataSchema: ObjectSchema = {
    $schema: schemaVersion,
    type: 'object',
    properties: {},
  }
  const initial: JsonObject = {}
  const derived: {
    name: string
    schema: DataSchema
    data: JsonValue
    node: UiDocumentNode
  }[] = []
  let nextId = 0

  function nodeFor(
    key: string,
    legacy: LegacySchema,
    schema: ObjectSchema,
    data: JsonObject,
    item = false,
  ): UiDocumentNode {
    const component = legacy['x-component'] as string
    const props = clean({ ...legacy['x-component-props'] }) as JsonObject
    const contract = widgetData(component, props)
    const kind: UiDocumentNode['kind'] =
      contract?.kind ??
      (legacy.type === 'void'
        ? 'void'
        : legacy.type === 'object'
          ? 'object'
          : legacy.type === 'array' && isJsonObject(legacy.items)
            ? 'array'
            : 'field')
    const node: UiDocumentNode = {
      id: legacy['x-designable-id'] ?? `field-${++nextId}`,
      key,
      kind,
      ...(component ? { component } : {}),
      ...(kind === 'void' || item ? {} : { bind: jsonPointer([key]) }),
    }
    const field = clean(
      Object.fromEntries(
        Object.entries(legacy).filter(
          ([name]) =>
            ['title', 'description', 'readOnly', 'writeOnly'].includes(name) ||
            (name.startsWith('x-') &&
              ![
                'x-component',
                'x-component-props',
                'x-index',
                'x-designable-id',
                'x-value',
              ].includes(name)),
        ),
      ),
    ) as JsonObject
    if (Object.keys(field).length) node.field = field
    const initialValue =
      legacy['x-value'] ??
      legacy.default ??
      (component === 'Text' ? props.content : undefined)
    if (component === 'Text') delete props.content
    for (const prop of displayValueProps(component)) {
      const value = props[prop]
      delete props[prop]
      if (typeof value === 'string' && /^\s*\{\{/u.test(value)) {
        const path = inlineBinding(value)
        if (path === undefined)
          throw new DocumentValidationError([
            {
              path: jsonPointer([key, prop]),
              component,
              message:
                'Convert the legacy expression to an explicit data binding',
            },
          ])
        ;(node.bindings ??= {})[prop] = { path }
      } else if (value !== undefined || prop === 'rows') {
        const name = `${node.id}-${prop}`
        const data = value ?? []
        ;(node.bindings ??= {})[prop] = { path: jsonPointer([name]) }
        let dataType: DataSchema = infer([data])
        if (prop === 'rows' && Array.isArray(data) && data.length === 0) {
          const { columns } = rowColumns(component, props)
          dataType = {
            type: 'array',
            items: {
              type: 'object',
              properties: Object.fromEntries(
                columns
                  .filter(({ column }) => column)
                  .map(({ column, types }) => [column, { type: types }]),
              ),
            },
          }
        }
        derived.push({ name, schema: dataType, data, node })
      }
    }
    if (
      (component === 'QuestionnaireStep' || component === 'StepperStep') &&
      Array.isArray(props.branches)
    )
      props.branches = props.branches.map((branch) =>
        isJsonObject(branch) && typeof branch.path === 'string'
          ? {
              ...branch,
              path: jsonPointer(FormPath.parse(branch.path).segments),
            }
          : branch,
      )
    if (Object.keys(props).length) node.props = props
    const own = kind === 'void' ? schema : migrateFieldSchema(legacy, node)
    const childDefaults: JsonObject = {}
    if (kind === 'object') own.properties = {}
    if (kind === 'array' && isJsonObject(legacy.items)) {
      const entry: ObjectSchema = { properties: {} }
      node.item = nodeFor('item', legacy.items as LegacySchema, entry, {}, true)
      own.items = entry.properties.item
      const keyProp = props.rowKey
      const row = schemaLookup(own).child(own, null)
      if (
        typeof keyProp === 'string' &&
        schemaLookup(own).accepts(schemaLookup(own).child(row, keyProp), [
          'string',
          'number',
        ])
      ) {
        node.rowKey = keyProp
      }
    }
    const properties = Object.entries(legacy.properties ?? {}).sort(
      ([, a], [, b]) => (a['x-index'] ?? 0) - (b['x-index'] ?? 0),
    )
    if (properties.length) {
      node.children = properties.map(([name, child]) =>
        nodeFor(
          name,
          child,
          kind === 'array' ? schema : own,
          kind === 'object' ? childDefaults : data,
        ),
      )
    }
    if (kind !== 'void') {
      ;(schema.properties ??= {})[key] = own
      if (legacy.required === true) (schema.required ??= []).push(key)
      if (initialValue !== undefined)
        data[key] = clean(initialValue) as JsonValue
      else if (kind === 'object' && Object.keys(childDefaults).length)
        data[key] = childDefaults
      else if (kind === 'array' && !item) data[key] = []
    }
    return node
  }

  const ui: FormDocuments['ui'] = {
    version: 1,
    ...(legacy.form ? { form: clean(legacy.form) } : {}),
    nodes: Object.entries(legacy.schema?.properties ?? {})
      .sort(([, a], [, b]) => (a['x-index'] ?? 0) - (b['x-index'] ?? 0))
      .map(([key, schema]) => nodeFor(key, schema, dataSchema, initial)),
  }
  for (const { name, schema, data, node } of derived) {
    if (Object.prototype.hasOwnProperty.call(dataSchema.properties, name))
      throw new DocumentValidationError([
        {
          path: jsonPointer([name]),
          component: node.component,
          message: 'Duplicate generated data path',
        },
      ])
    dataSchema.properties[name] = schema
    initial[name] = data
  }
  return { ui, dataSchema, data: values ? clean(values) : initial }
}
