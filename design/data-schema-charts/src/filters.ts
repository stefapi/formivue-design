import {
  chartDataContracts,
  periodStart,
} from '@formivue-design/charts-runtime/data-contract'
import {
  parseDocumentBindingExpression,
  type DataBinding,
  type DocumentComponentContract,
  type DocumentDataType,
  type DocumentRenameContext,
  type DocumentRowsContract,
  type DocumentSchemaDescription,
} from '@formivue-design/formivue-transformer'
import {
  isJsonObject,
  type JsonObject,
  type JsonValue,
} from '@formivue/json-schema'

type Operation = keyof typeof chartDataContracts.filters
const operations = chartDataContracts.filters as Record<
  Operation,
  {
    columnTypes: DocumentDataType[]
    valueTypes: DocumentDataType[]
  }
>
const has = (object: object, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key)
const isExpression = (value: unknown) =>
  typeof value === 'string' && /^\s*\{\{[\s\S]*\}\}\s*$/u.test(value)

function operation(value: unknown): Operation | undefined {
  return typeof value === 'string' && has(operations, value)
    ? (value as Operation)
    : undefined
}

export function filterColumns(
  props: JsonObject,
): DocumentRowsContract['columns'] {
  if (!Array.isArray(props.filters)) return []
  return props.filters.flatMap((filter, index) => {
    if (
      !isJsonObject(filter) ||
      typeof filter.column !== 'string' ||
      !filter.column
    )
      return []
    const mode = operation(filter.operation)
    return mode
      ? [
          {
            column: filter.column as string,
            types: operations[mode].columnTypes,
            property: `filters[${index}].column`,
          },
        ]
      : []
  })
}

export const migrateChartFilters: DocumentComponentContract['normalizeProps'] =
  (props) => {
    if (!Array.isArray(props.filters)) return props
    return {
      ...props,
      filters: props.filters.map((filter) => {
        if (
          !isJsonObject(filter) ||
          has(filter, 'valueBinding') ||
          typeof filter.value !== 'string'
        )
          return filter
        const path = parseDocumentBindingExpression(filter.value)
        if (path === undefined) return filter
        const migrated: JsonObject = { ...filter, valueBinding: { path } }
        delete migrated.value
        return migrated
      }),
    }
  }

function binding(value: JsonValue): DataBinding | undefined {
  if (
    !isJsonObject(value) ||
    typeof value.path !== 'string' ||
    (value.scope !== undefined && value.scope !== 'parent')
  )
    return
  return {
    path: value.path,
    ...(value.scope === 'parent' ? { scope: 'parent' } : {}),
  }
}

const inactive = (value: unknown) =>
  value === undefined || value === null || value === ''
const scalarType = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value)
    ? 'integer'
    : typeof value
const accepts = (types: readonly string[], type: string) =>
  types.includes(type) || (type === 'integer' && types.includes('number'))

function choices(schema: DocumentSchemaDescription) {
  const { enum: values, const: constant } = schema.constraints
  return (
    has(schema.constraints, 'const')
      ? [constant]
      : Array.isArray(values)
        ? values
        : undefined
  )?.filter((value) => !inactive(value))
}

function acceptsDates(schema: DocumentSchemaDescription) {
  const active = schema.types.filter((type) => type !== 'null')
  const { format } = schema.constraints
  return (
    active.length > 0 &&
    active.every((type) => accepts(operations.dateRange.columnTypes, type)) &&
    (format === undefined || format === 'date' || format === 'date-time') &&
    (choices(schema)?.every(
      (value) => periodStart(value, 'day') !== undefined,
    ) ??
      true)
  )
}

function acceptedByColumn(
  schema: DocumentSchemaDescription,
  column: DocumentSchemaDescription,
) {
  const offered = choices(schema)
  const allowed = choices(column)
  return offered
    ? offered.every(
        (value) =>
          accepts(column.types, scalarType(value)) &&
          (!allowed || allowed.includes(value)),
      )
    : schema.types.every(
        (type) => type === 'null' || accepts(column.types, type),
      )
}

function matchesBinding(
  schema: DocumentSchemaDescription,
  column: DocumentSchemaDescription,
) {
  const offered = choices(schema)
  if (offered)
    return offered.every((value) =>
      compatibleLiteral('matches', value as JsonValue, column),
    )
  if (
    !schema.types.every(
      (type) =>
        type === 'array' || type === 'null' || accepts(column.types, type),
    )
  )
    return false
  if (!schema.types.includes('array')) return true
  const { prefixItems, maxItems, items } = schema.constraints
  const prefixCount = Array.isArray(prefixItems) ? prefixItems.length : 0
  const positional = Math.min(
    prefixCount,
    typeof maxItems === 'number' ? maxItems : prefixCount,
  )
  for (let index = 0; index < positional; index++) {
    const item = schema.item(index)
    if (!item || !acceptedByColumn(item, column)) return false
  }
  if (
    items === false ||
    (typeof maxItems === 'number' && maxItems <= prefixCount)
  )
    return true
  const item = schema.item()
  return !!item && acceptedByColumn(item, column)
}

function compatibleRange(schema: DocumentSchemaDescription) {
  const { minItems, maxItems } = schema.constraints
  if (
    (typeof minItems === 'number' && minItems > 2) ||
    (typeof maxItems === 'number' && maxItems < 2)
  )
    return false
  return [0, 1].every((index) => {
    const item = schema.item(index)
    return !!item && acceptsDates(item)
  })
}

function compatibleLiteral(
  mode: Operation,
  value: JsonValue,
  column?: DocumentSchemaDescription,
) {
  if (inactive(value)) return true
  if (mode === 'dateRange')
    return (
      Array.isArray(value) &&
      (value.length === 0 ||
        (value.length === 2 &&
          value.every(
            (part) => inactive(part) || periodStart(part, 'day') !== undefined,
          )))
    )
  const values = Array.isArray(value) ? value : [value]
  const allowed = column && choices(column)
  return values.every(
    (part) =>
      inactive(part) ||
      (['string', 'number', 'boolean'].includes(typeof part) &&
        (!column || accepts(column.types, scalarType(part))) &&
        (!allowed || allowed.includes(part))),
  )
}

export const compileChartFilters: DocumentComponentContract['compileProps'] = (
  props,
  context,
) => {
  if (props.filters === undefined) return props
  if (!Array.isArray(props.filters)) {
    context.report({
      property: 'filters',
      code: 'invalid_chart_filter',
      message: 'Chart filters must be an array',
    })
    return props
  }
  const filters = props.filters.map((filter, index) => {
    const property = `filters[${index}]`
    const invalid = (message: string, suffix?: string, path?: string) =>
      context.report({
        property: suffix ? property + '.' + suffix : property,
        path,
        code: 'invalid_chart_filter',
        message,
      })
    if (
      !isJsonObject(filter) ||
      typeof filter.column !== 'string' ||
      !filter.column ||
      !operation(filter.operation)
    ) {
      invalid('A chart filter needs a column and a supported operation')
      return filter
    }
    const mode = operation(filter.operation)
    const column = context.columnSchema('rows', filter.column)
    if (mode === 'dateRange' && column && !acceptsDates(column))
      invalid('The period filter column must accept dates', 'column')
    if (!has(filter, 'valueBinding')) {
      const value = filter.value
      if (
        !compatibleLiteral(mode, value, column) ||
        (Array.isArray(value) ? value : [value]).some(isExpression)
      )
        invalid(
          'Use an explicit filter binding or a compatible literal value',
          'value',
        )
      return filter
    }
    const source = binding(filter.valueBinding as JsonValue)
    if (!source || has(filter, 'value')) {
      invalid(
        'A filter value binding needs a JSON Pointer and an optional parent scope',
        'valueBinding',
      )
      return filter
    }
    const resolved = context.resolveBinding(
      source,
      property + '.valueBinding',
      operations[mode].valueTypes,
    )
    if (!resolved?.schema) return filter
    const validTypes =
      resolved.types.some((type) => type !== 'null') &&
      resolved.types.every((type) => accepts(operations[mode].valueTypes, type))
    if (
      !validTypes ||
      (mode === 'dateRange' && !compatibleRange(resolved.schema)) ||
      (mode === 'matches' && column && !matchesBinding(resolved.schema, column))
    )
      invalid(
        mode === 'dateRange'
          ? 'The period filter binding must accept a pair of dates'
          : 'The filter binding must supply values compatible with its column',
        'valueBinding',
        resolved.path,
      )

    const runtime: JsonObject = { ...filter, value: resolved.expression }
    delete runtime.valueBinding
    return runtime
  })
  return { ...props, filters }
}

export function renameFilterBinding(
  filter: JsonObject,
  renameBinding: DocumentRenameContext['renameBinding'],
): JsonObject {
  const source = binding(filter.valueBinding as JsonValue)
  if (!source) return filter
  const renamed = renameBinding(source)
  return renamed === source
    ? filter
    : { ...filter, valueBinding: { ...renamed } }
}
