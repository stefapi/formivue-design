import {
  chartAppearance,
  chartDataColumns,
  validateChartRows,
} from '@formivue-design/charts-runtime/data-contract'

export const scalarTypes = ['string', 'number', 'boolean', 'null']
const choices = ['string', 'number']

const fields: Record<string, string[]> = {
  Input: ['string'],
  'Input.TextArea': ['string'],
  Password: ['string'],
  NumberPicker: ['number'],
  Rate: ['number'],
  Slider: ['number'],
  DatePicker: ['string'],
  TimePicker: ['string'],
  Switch: ['boolean'],
  'Radio.Group': choices,
  Combobox: choices,
  InputOTP: ['string'],
  Text: ['string'],
  PreviewText: scalarTypes,
  Checkbox: ['boolean'],
  Radio: choices,
}
const lists: Record<string, string[]> = {
  'Checkbox.Group': choices,
  Cascader: choices,
  Transfer: choices,
  TagsInput: ['string'],
  'DatePicker.RangePicker': ['string'],
  'TimePicker.RangePicker': ['string'],
  Upload: ['object'],
  'Upload.Dragger': ['object'],
}
const displays: Record<string, string[]> = {
  Avatar: ['src', 'alt', 'fallback'],
  Badge: ['text'],
  HoverCard: ['triggerText', 'title', 'message', 'href'],
}
const layouts = new Set([
  'FormItem',
  'Card',
  'Space',
  'FormLayout',
  'FormGrid',
  'FormGrid.GridColumn',
  'FormTab',
  'FormTab.TabPane',
  'FormCollapse',
  'FormCollapse.CollapsePanel',
  'Carousel',
  'CarouselSlide',
  'Drawer',
  'Sheet',
  'ScrollArea',
  'Resizable',
  'ResizablePanel',
  'Questionnaire',
  'QuestionnaireStep',
  'Stepper',
  'StepperStep',
])

export const isChart = (
  component: string,
): component is keyof typeof chartAppearance =>
  !!component &&
  Object.prototype.hasOwnProperty.call(chartAppearance, component)

export const isRowsDisplay = (component: string) =>
  component === 'DataTable' || isChart(component)
export const displayValueProps = (component: string) =>
  isRowsDisplay(component) ? ['rows'] : (displays[component] ?? [])

export function widgetData(
  component: string,
  props: Record<string, unknown> = {},
) {
  if (component === 'Object') return { kind: 'object' as const }
  if (component === 'ArrayTable' || component === 'ArrayCards')
    return { kind: 'array' as const }
  if (
    isRowsDisplay(component) ||
    Object.prototype.hasOwnProperty.call(displays, component) ||
    layouts.has(component) ||
    /^(ArrayTable|ArrayCards)\./u.test(component)
  )
    return { kind: 'void' as const }
  if (
    component === 'Select' ||
    component === 'TreeSelect' ||
    component === 'ToggleGroup'
  )
    return props.multiple === true
      ? { kind: 'field' as const, types: ['array'], items: choices }
      : { kind: 'field' as const, types: choices }
  if (Object.prototype.hasOwnProperty.call(lists, component))
    return { kind: 'field' as const, types: ['array'], items: lists[component] }
  if (Object.prototype.hasOwnProperty.call(fields, component))
    return { kind: 'field' as const, types: fields[component] }
}

export function rowColumns(component: string, props: Record<string, unknown>) {
  if (isChart(component)) return chartDataColumns(component, props)
  const columns = Array.isArray(props.columns) ? props.columns : []
  return {
    columns: columns.map((column) => ({
      column: column?.key,
      types: scalarTypes,
    })),
    incomplete: columns.some(
      (column) => typeof column?.key !== 'string' || !column.key,
    ),
  }
}

export function rowIssues(
  component: string,
  props: Record<string, unknown>,
  rows: unknown[],
) {
  if (!isChart(component)) return []
  const report = validateChartRows(
    component,
    props,
    rows as Record<string, unknown>[],
  )
  return report.cyclic
    ? [{ path: [], message: 'Sankey flows must be acyclic' }]
    : report.examples.map(({ row, column, reason }) => ({
        path: column ? [String(row - 1), column] : [String(row - 1)],
        message: `Invalid chart data (${reason})`,
      }))
}
