import { isDatePeriod, periodStart } from './date-period'
import catalog from '../chart-data-contracts.json'
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

type ColumnRole =
  | 'period'
  | 'label'
  | 'group'
  | 'number'
  | 'date'
  | 'latitude'
  | 'longitude'
  | 'country'
type ColumnRule = [keyof MappingOptions, ColumnRole, 'whenSet'?]
interface MappingRule {
  when?: Partial<Record<keyof MappingOptions, boolean>>
  required: ColumnRule[]
  optional?: ColumnRule[]
  series?: boolean
  aggregate?: Mapping['aggregate']
}

const profiles = catalog.profiles as unknown as Record<string, MappingRule[]>
const chartRules: Partial<Record<ChartName, readonly string[]>> = catalog.rules

export const chartColumnProperties = [
  ...new Set(
    Object.values(profiles).flatMap((rules) =>
      rules.flatMap(({ required, optional }) =>
        [...required, ...(optional ?? [])].map(([property]) => property),
      ),
    ),
  ),
]

function mappingFor(
  name: ChartName,
  props: MappingOptions,
  country: Parser,
): Mapping {
  const period = props.datePeriod
  const parsers: Record<ColumnRole, [Parser, ColumnCheck['reason']]> = {
    period: isDatePeriod(period)
      ? [(value) => periodStart(value, period), 'date']
      : [categoryValue, 'label'],
    label: [label, 'label'],
    group: [groupValue, 'label'],
    number: [num, 'number'],
    date: [epoch, 'date'],
    latitude: [latitude, 'latitude'],
    longitude: [longitude, 'longitude'],
    country: [country, 'country'],
  }
  const rule = profiles[catalog.charts[name]].find(({ when }) =>
    Object.entries(when ?? {}).every(
      ([key, value]) => Boolean(props[key]) === value,
    ),
  )
  const columns = (entries: ColumnRule[]) =>
    entries.flatMap(([property, role, condition]) =>
      condition === 'whenSet' && !props[property]
        ? []
        : [check(props[property] as string, ...parsers[role])],
    )
  return {
    required: columns(rule.required),
    optional: rule.optional && columns(rule.optional),
    aggregate: rule.aggregate,
    series: rule.series
      ? (Array.isArray(props.series) ? props.series : []).flatMap((item) =>
          typeof item?.key === 'string' && item.key
            ? [check(item.key, num, 'number')]
            : [],
        )
      : undefined,
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
      chartRules[name]?.includes('dateOrder') &&
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
    ].map<{ column: string; types: ('string' | 'number' | 'boolean')[] }>(
      ({ column, parse, reason }) => ({
        column,
        types:
          reason === 'number' || reason === 'latitude' || reason === 'longitude'
            ? ['number']
            : reason === 'country'
              ? ['string']
              : parse === categoryValue || reason === 'date'
                ? ['string', 'number']
                : ['string', 'number', 'boolean'],
      }),
    ),
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
    chartRules[name]?.includes('acyclic') && !report.ignored
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
