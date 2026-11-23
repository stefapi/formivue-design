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

function groupRows(
  rows: ChartRow[],
  xKey: string,
  valueKey: string,
  aggregation: Aggregation,
  groupKey?: string,
): ChartData {
  const groups = new Set<Group>()
  const categories = new Map<Category, Map<Group, Total>>()
  for (const row of rows) {
    const category = categoryValue(read(row, xKey))
    const group = groupKey ? groupValue(read(row, groupKey)) : valueKey
    if (category === undefined || group === undefined) continue
    groups.add(group)
    let aggregates = categories.get(category)
    if (!aggregates) {
      aggregates = new Map()
      categories.set(category, aggregates)
    }

    const value = num(read(row, valueKey))
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
        return aggregateValue(aggregate, aggregation)
      }),
    })),
  }
}

function collectData(props: {
  rows: ChartRow[]
  xKey: string
  series: ChartSeries[]
  groupKey: string
  valueKey: string
  aggregation: Aggregation
  circular: boolean
}): ChartData {
  const rows = (Array.isArray(props.rows) ? props.rows : []).filter(isChartRow)
  const series = (Array.isArray(props.series) ? props.series : []).filter(
    (entry) => typeof entry?.key === 'string' && entry.key !== '',
  )
  if (props.circular || props.groupKey) {
    if (!props.xKey || !props.valueKey) return { series: [], points: [] }
    const data = groupRows(
      rows,
      props.xKey,
      props.valueKey,
      props.aggregation,
      props.circular ? undefined : props.groupKey,
    )
    if (props.circular && data.series.length) {
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
    points: rows.flatMap((row) => {
      const category = categoryValue(read(row, props.xKey))
      return category === undefined
        ? []
        : [{ category, values: series.map(({ key }) => num(read(row, key))) }]
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
  return {
    series,
    points: points.map(({ category, values }, index) => ({
      index,
      label: category === undefined ? '' : String(category),
      values,
    })),
  }
}
