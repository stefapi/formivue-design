import { isDatePeriod, periodStart } from './date-period'
import { hasFlowCycle, pairs } from './special-data'
import type { ChartName } from './appearance'
import type { ChartOptions } from './base'
import {
  addValue,
  aggregateValue,
  categoryValue,
  epoch,
  groupValue,
  isChartRow,
  label,
  latitude,
  longitude,
  num,
  orderedInterval,
  read,
  type Total,
} from './row-data'

export type MappingOptions = Partial<
  Pick<
    ChartOptions,
    | 'xKey'
    | 'groupKey'
    | 'valueKey'
    | 'series'
    | 'aggregation'
    | 'datePeriod'
    | 'countRows'
    | 'sourceKey'
    | 'targetKey'
    | 'startKey'
    | 'endKey'
    | 'latitudeKey'
    | 'longitudeKey'
    | 'destinationLatitudeKey'
    | 'destinationLongitudeKey'
  >
>

export interface MappingExample {
  row: number
  column?: string
  value?: unknown
  reason:
    | 'record'
    | 'label'
    | 'number'
    | 'date'
    | 'dateOrder'
    | 'latitude'
    | 'longitude'
    | 'country'
    | 'positiveTotal'
    | 'finiteTotal'
}

type Parser = (value: unknown) => string | number | boolean | undefined

interface ColumnCheck {
  column: string
  parse: Parser
  reason: MappingExample['reason']
}

interface Mapping {
  required: ColumnCheck[]
  series?: ColumnCheck[]
  optional?: ColumnCheck[]
  aggregate?: 'finite' | 'positive'
}

const check = (
  column: string,
  parse: Parser,
  reason: ColumnCheck['reason'],
) => ({ column, parse, reason })

function mappingFor(
  name: ChartName,
  props: MappingOptions,
  country: Parser,
): Mapping {
  const period = props.datePeriod
  const x = isDatePeriod(period)
    ? check(props.xKey, (value) => periodStart(value, period), 'date')
    : check(props.xKey, categoryValue, 'label')
  const category = check(props.xKey, label, 'label')
  const value = check(props.valueKey, num, 'number')
  const group = check(props.groupKey, label, 'label')
  const coordinates = [
    check(props.latitudeKey, latitude, 'latitude'),
    check(props.longitudeKey, longitude, 'longitude'),
  ]
  switch (name) {
    case 'BarChart':
    case 'StackedBarChart':
    case 'LineChart':
    case 'AreaChart': {
      const dimensions = props.groupKey
        ? [x, check(props.groupKey, groupValue, 'label')]
        : [x]
      if (props.countRows) return { required: dimensions }
      if (props.groupKey)
        return { required: [...dimensions, value], aggregate: 'finite' }
      const series = Array.isArray(props.series) ? props.series : []
      return {
        required: [x],
        series: series.flatMap((item) =>
          typeof item?.key === 'string' && item.key
            ? [check(item.key, num, 'number')]
            : [],
        ),
      }
    }
    case 'PieChart':
    case 'DonutChart':
      return props.countRows
        ? { required: [x] }
        : { required: [x, value], aggregate: 'positive' }
    case 'RadialBarChart':
    case 'CircularBarChart':
      return { required: [category, value], aggregate: 'positive' }
    case 'NestedDonutChart':
    case 'TreemapChart':
      return {
        required: props.groupKey ? [category, group, value] : [category, value],
        aggregate: 'positive',
      }
    case 'HeatmapChart':
      return { required: [category, group, value], aggregate: 'finite' }
    case 'ScatterChart':
      return { required: [check(props.xKey, num, 'number'), value] }
    case 'BoxplotChart':
      return { required: [category, value] }
    case 'TimelineChart':
      return {
        required: [
          category,
          check(props.startKey, epoch, 'date'),
          check(props.endKey, epoch, 'date'),
        ],
      }
    case 'SankeyChart':
    case 'ChordChart':
    case 'NetworkGraph': {
      const endpoints = [
        check(props.sourceKey, label, 'label'),
        check(props.targetKey, label, 'label'),
      ]
      return {
        required:
          name === 'NetworkGraph' && !props.valueKey
            ? endpoints
            : [...endpoints, value],
        aggregate: 'positive',
      }
    }
    case 'PointMap':
      return { required: coordinates, optional: [category, value] }
    case 'FlowMap':
      return {
        required: [
          ...coordinates,
          check(props.destinationLatitudeKey, latitude, 'latitude'),
          check(props.destinationLongitudeKey, longitude, 'longitude'),
        ],
        optional: [category, value],
      }
    case 'ChoroplethMap':
      return {
        required: [check(props.xKey, country, 'country'), value],
        aggregate: 'finite',
      }
  }
}

function inspectMapping(
  name: ChartName,
  props: MappingOptions,
  rows: readonly unknown[],
  declaredColumns: readonly string[] | undefined,
  country: Parser,
) {
  const { required, series, optional, aggregate } = mappingFor(
    name,
    props,
    country,
  )
  const columns = new Set(declaredColumns)
  if (!declaredColumns)
    for (const row of rows) {
      if (isChartRow(row)) Object.keys(row).forEach((key) => columns.add(key))
    }

  const mapped = [
    ...required.map(({ column }) => column),
    ...(series?.map(({ column }) => column) ?? []),
    ...(optional?.map(({ column }) => column) ?? []),
  ]
  const missingColumns =
    declaredColumns || rows.some(isChartRow)
      ? [...new Set(mapped.filter((key) => key && !columns.has(key)))]
      : []
  const incomplete =
    required.some(({ column }) => !column) || series?.length === 0
  const report = {
    missingColumns,
    incomplete,
    ignored: 0,
    examples: [] as MappingExample[],
  }
  if (incomplete) return report

  const exampleLimit = 3
  const ignore = (example: MappingExample) => {
    report.ignored++
    if (report.examples.length < exampleLimit) report.examples.push(example)
  }
  const groups = new Map<string, { total: Total; examples: MappingExample[] }>()
  const countsRows = name === 'NetworkGraph' && !props.valueKey
  rows.forEach((row, index) => {
    const rowNumber = index + 1
    if (!isChartRow(row)) {
      ignore({ row: rowNumber, reason: 'record' })
      return
    }

    const values = required.map(({ column, parse }) => parse(read(row, column)))
    const bad = required[values.indexOf(undefined)]
    if (bad) {
      ignore({
        row: rowNumber,
        column: bad.column,
        value: read(row, bad.column),
        reason: bad.reason,
      })
      return
    }

    if (
      series &&
      !series.some(
        ({ column, parse }) => parse(read(row, column)) !== undefined,
      )
    ) {
      const { column, reason } = series[0]
      ignore({ row: rowNumber, column, value: read(row, column), reason })
      return
    }
    if (
      name === 'TimelineChart' &&
      !orderedInterval(Number(values[1]), Number(values[2]))
    ) {
      ignore({
        row: rowNumber,
        column: props.endKey,
        value: read(row, props.endKey),
        reason: 'dateOrder',
      })
      return
    }

    if (aggregate) {
      const key = JSON.stringify(countsRows ? values : values.slice(0, -1))
      const value = countsRows ? 1 : Number(values[values.length - 1])
      const previous = groups.get(key)
      const examples = previous?.examples ?? []
      if (examples.length < exampleLimit)
        examples.push({
          row: rowNumber,
          column: props.valueKey,
          value,
          reason: 'positiveTotal',
        })
      groups.set(key, { total: addValue(previous?.total, value), examples })
    }
  })

  const candidates = [...report.examples]
  for (const { total, examples } of groups.values()) {
    const value = aggregateValue(total, props.aggregation)
    if (value !== undefined && (aggregate === 'finite' || value > 0)) continue
    report.ignored += total.count
    candidates.push(
      ...examples.map((example): MappingExample => ({
        ...example,
        reason: value === undefined ? 'finiteTotal' : 'positiveTotal',
      })),
    )
  }
  report.examples = candidates
    .sort((a, b) => a.row - b.row)
    .slice(0, exampleLimit)
  return report
}

export function chartDataColumns(name: ChartName, props: MappingOptions) {
  const { required, series, optional } = mappingFor(name, props, label)
  return {
    columns: [
      ...required,
      ...(series ?? []),
      ...(optional?.filter(({ column }) => column) ?? []),
    ].map(({ column, parse, reason }) => ({
      column,
      types:
        reason === 'number' || reason === 'latitude' || reason === 'longitude'
          ? ['number']
          : reason === 'country'
            ? ['string']
            : parse === categoryValue || reason === 'date'
              ? ['string', 'number']
              : ['string', 'number', 'boolean'],
    })),
    incomplete: required.some(({ column }) => !column) || series?.length === 0,
  }
}

export function validateChartRows(
  name: ChartName,
  props: MappingOptions,
  rows: ChartOptions['rows'],
  country: Parser,
) {
  const report = inspectMapping(name, props, rows, undefined, country)
  const links =
    name === 'SankeyChart' && !report.ignored
      ? pairs(
          { rows, aggregation: props.aggregation, valueKey: props.valueKey },
          props.sourceKey,
          props.targetKey,
        )
          .filter(({ value }) => value > 0)
          .map(({ first: source, second: target }) => ({ source, target }))
      : []
  return { ...report, cyclic: hasFlowCycle(links) }
}

export async function loadChartMappingDiagnostics(name: ChartName) {
  const country =
    name === 'ChoroplethMap'
      ? (await import('./country')).countryCode
      : undefined
  return (
    props: MappingOptions,
    rows: readonly unknown[],
    declaredColumns?: readonly string[],
  ) => inspectMapping(name, props, rows, declaredColumns, country)
}
