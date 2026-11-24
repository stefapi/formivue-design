import {
  addValue,
  aggregateValue,
  categoryValue,
  groupValue,
  isChartRow,
  num,
  read,
  type Aggregation,
  type Category,
  type ChartRow,
  type Group,
  type Total,
} from './row-data'

import {
  isDatePeriod,
  periodFormatter,
  periodStart,
  type DatePeriod,
} from './date-period'
import { chartLanguageIndex } from './locale'

export interface ChartSeries {
  key: string
  title?: string
  color?: string
}

interface ChartPoint {
  category: Category | undefined
  values: (number | undefined)[]
}

type CategoryOrder = 'source' | 'ascending' | 'descending'

interface ChartData {
  series: { title: string; color?: string }[]
  points: ChartPoint[]
}

type ReadCategory = (row: ChartRow) => Category | undefined

interface ChartDataOptions {
  rows: ChartRow[]
  xKey: string
  series: ChartSeries[]
  groupKey: string
  valueKey: string
  aggregation: Aggregation
  circular: boolean
  datePeriod?: DatePeriod
  countRows?: boolean
  locale?: string
}

function groupRows(
  rows: ChartRow[],
  props: ChartDataOptions,
  readCategory: ReadCategory,
): ChartData {
  const { valueKey, aggregation, countRows, locale } = props
  const groupKey = props.circular ? '' : props.groupKey
  const measure = countRows
    ? ['Row count', 'Nombre de lignes', 'Recuento de filas'][
        chartLanguageIndex(locale)
      ]
    : valueKey
  const groups = new Set<Group>()
  const categories = new Map<Category, Map<Group, Total>>()
  for (const row of rows) {
    const category = readCategory(row)
    const group = groupKey ? groupValue(read(row, groupKey)) : measure
    if (category === undefined || group === undefined) continue
    groups.add(group)
    let aggregates = categories.get(category)
    if (!aggregates) {
      aggregates = new Map()
      categories.set(category, aggregates)
    }

    const value = countRows ? 1 : num(read(row, valueKey))
    if (value === undefined) continue
    aggregates.set(group, addValue(aggregates.get(group), value))
  }

  return {
    series: Array.from(groups, (group) => ({ title: String(group) })),
    points: Array.from(categories, ([category, aggregates]) => ({
      category,
      values: Array.from(groups, (group) => {
        const aggregate = aggregates.get(group)
        if (!aggregate) return undefined
        return countRows
          ? aggregate.count
          : aggregateValue(aggregate, aggregation)
      }),
    })),
  }
}

function periodPoints(
  rows: ChartRow[],
  readCategory: ReadCategory,
  series: ChartSeries[],
  aggregation: Aggregation,
) {
  const periods = new Map<Category, (Total | undefined)[]>()
  for (const row of rows) {
    const period = readCategory(row)
    if (period === undefined) continue
    const totals =
      periods.get(period) ??
      new Array<Total | undefined>(series.length).fill(undefined)
    series.forEach(({ key }, index) => {
      const value = num(read(row, key))
      if (value !== undefined) totals[index] = addValue(totals[index], value)
    })
    periods.set(period, totals)
  }
  return Array.from(periods, ([category, totals]) => ({
    category,
    values: totals.map((total) => total && aggregateValue(total, aggregation)),
  }))
}

function collectData(props: ChartDataOptions): ChartData {
  const rows = (Array.isArray(props.rows) ? props.rows : []).filter(isChartRow)
  const series = (Array.isArray(props.series) ? props.series : []).filter(
    (entry) => typeof entry?.key === 'string' && entry.key !== '',
  )
  const period = props.datePeriod
  const byPeriod = isDatePeriod(period)
  const readCategory: ReadCategory = byPeriod
    ? (row) => periodStart(read(row, props.xKey), period)
    : (row) => categoryValue(read(row, props.xKey))
  if (props.circular || props.groupKey || props.countRows) {
    if (!props.xKey || (!props.countRows && !props.valueKey))
      return { series: [], points: [] }
    const data = groupRows(rows, props, readCategory)
    if (props.circular && !props.countRows && data.series.length) {
      data.series[0].title =
        series.find(({ key }) => key === props.valueKey)?.title ||
        props.valueKey
    }
    return data
  }
  return {
    series: series.map(({ key, title, color }) => ({
      title: title || key,
      color,
    })),
    points: byPeriod
      ? periodPoints(rows, readCategory, series, props.aggregation)
      : rows.flatMap((row) => {
          const category = readCategory(row)
          return category === undefined
            ? []
            : [
                {
                  category,
                  values: series.map(({ key }) => num(read(row, key))),
                },
              ]
        }),
  }
}

export function chartData(
  props: Parameters<typeof collectData>[0] & {
    categoryOrder: CategoryOrder
  },
) {
  const { series, points } = collectData(props)
  const order = props.categoryOrder
  if (order === 'ascending' || order === 'descending') {
    const collator = new Intl.Collator(undefined, { numeric: true })
    const direction = order === 'ascending' ? 1 : -1
    points.sort(({ category: left }, { category: right }) => {
      const a = categoryValue(left)
      const b = categoryValue(right)
      if (a === undefined) return b === undefined ? 0 : 1
      if (b === undefined) return -1
      if (typeof a === 'number')
        return direction * (typeof b === 'number' ? a - b : -1)
      if (typeof b === 'number') return direction
      return direction * collator.compare(a, b)
    })
  }
  const formatPeriod = isDatePeriod(props.datePeriod)
    ? periodFormatter(props.datePeriod, props.locale)
    : undefined
  return {
    series,
    points: points.map(({ category, values }, index) => ({
      index,
      label:
        formatPeriod && typeof category === 'number'
          ? formatPeriod(category)
          : category === undefined
            ? ''
            : String(category),
      values,
    })),
  }
}
