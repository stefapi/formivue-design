import type { ISchema } from '@formivue/json-schema'

export type PropertySchema = ISchema & { anyOf?: ISchema[] }

export const jsonScalar: PropertySchema = {
  anyOf: ['string', 'number', 'boolean', 'null'].map((type) => ({ type })),
}

type Editor =
  | 'Input'
  | 'Input.TextArea'
  | 'Switch'
  | 'NumberPicker'
  | 'ValueInput'
  | string[]

export const componentSchema = <Properties extends Record<string, ISchema>>(
  properties: Properties,
) => ({ type: 'object', properties }) satisfies ISchema

export const editor = (
  component: Editor,
  props?: Record<string, unknown>,
  schema?: PropertySchema,
): PropertySchema => ({
  type:
    component === 'Switch'
      ? 'boolean'
      : component === 'NumberPicker'
        ? 'number'
        : 'string',
  'x-decorator': 'FormItem',
  'x-component': Array.isArray(component) ? 'Select' : component,
  ...(Array.isArray(component) ? { enum: component } : {}),
  ...(component === 'NumberPicker'
    ? { minimum: props?.min as number, maximum: props?.max as number }
    : {}),
  ...(props ? { 'x-component-props': props } : {}),
  ...schema,
})

export const jsonArray = (items: ISchema, allowExpression = false): ISchema =>
  editor(
    'ValueInput',
    {
      include: allowExpression ? ['JSON', 'EXPRESSION'] : ['JSON'],
      jsonType: 'array',
    },
    { type: 'array', items },
  )

const countRows = '!!$values["x-component-props"]?.countRows'
const datePeriodValue = '$values["x-component-props"]?.datePeriod'
const byDate = `["day", "week", "month"].includes(${datePeriodValue})`
const grouping = '$values["x-component-props"]?.groupKey'
const format = '$values["x-component-props"]?.valueFormat'
export const hideWhen = (condition: string) => ({
  fulfill: { state: { hidden: `{{${condition}}}` } },
})

export const axis = (numeric = false) => ({
  ...editor('Input', { numeric }),
  'x-component': 'ChartAxis',
})

export const categoryOrder = editor(['source', 'ascending', 'descending'], {
  defaultValue: 'source',
})
export const aggregation = (hidden?: string) =>
  editor(
    ['sum', 'mean'],
    { defaultValue: 'sum' },
    hidden ? { 'x-reactions': hideWhen(hidden) } : undefined,
  )

const periodColumn = {
  ...axis(),
  'x-component-props': { allowDatePeriod: true },
}
const datePeriod = editor(['none', 'day', 'week', 'month'], {
  defaultValue: 'none',
})
const countControl = editor('Switch')

export const categoricalMapping = {
  xKey: periodColumn,
  datePeriod,
  countRows: countControl,
  categoryOrder,
  groupKey: axis(),
  valueKey: {
    ...axis(true),
    'x-reactions': hideWhen(`!${grouping} || ${countRows}`),
  },
  aggregation: aggregation(`(!${grouping} && !(${byDate})) || ${countRows}`),
  series: {
    ...jsonArray({
      type: 'object',
      required: ['key'],
      properties: {
        key: { type: 'string' },
        title: { type: 'string' },
        color: { type: 'string' },
      },
    }),
    'x-component': 'ChartSeriesInput',
    'x-reactions': hideWhen(`!!${grouping} || ${countRows}`),
  },
}

export const sliceMapping = {
  xKey: axis(),
  categoryOrder,
  valueKey: axis(true),
  aggregation: aggregation(),
}
export const periodSliceMapping = {
  ...sliceMapping,
  xKey: periodColumn,
  datePeriod,
  countRows: countControl,
  valueKey: { ...axis(true), 'x-reactions': hideWhen(countRows) },
  aggregation: aggregation(countRows),
}
export const hierarchyMapping = { ...sliceMapping, groupKey: axis() }
export const linkMapping = {
  sourceKey: axis(),
  targetKey: axis(),
  valueKey: axis(true),
  categoryOrder,
}

export const chartSchema = <Mapping extends Record<string, ISchema>>(
  mapping: Mapping,
  numericFormat = true,
) =>
  componentSchema({
    rows: {
      ...jsonArray({ type: 'object', additionalProperties: jsonScalar }, true),
      'x-component': 'ChartRows',
    },
    ...mapping,
    filters: {
      type: 'array',
      'x-decorator': 'FormItem',
      'x-component': 'ChartFilters',
      items: {
        type: 'object',
        properties: {
          column: { type: 'string' },
          operation: { type: 'string', enum: ['matches', 'dateRange'] },
          value: {},
        },
      },
    },
    ...(numericFormat
      ? {
          valueFormat: editor(
            ['auto', 'euro', 'percent', 'decimal'],
            { defaultValue: 'auto' },
            'countRows' in mapping
              ? { 'x-reactions': hideWhen(countRows) }
              : undefined,
          ),
          decimalPlaces: editor(
            'NumberPicker',
            { min: 0, max: 20, precision: 0, placeholder: '2' },
            {
              'x-reactions': hideWhen(
                `!["euro", "percent", "decimal"].includes(${format})${'countRows' in mapping ? ` || ${countRows}` : ''}`,
              ),
            },
          ),
        }
      : {}),
    label: editor('Input'),
    height: editor('NumberPicker', { min: 80, placeholder: '240' }),
    dataLabel: editor('Input'),
    emptyText: editor('Input'),
  })
