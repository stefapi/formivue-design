import { periodStart } from './date-period'
import { groupValue, isChartRow, read, type ChartRow } from './row-data'

export interface ChartFilter {
  column: string
  operation: 'matches' | 'dateRange'
  value?: unknown
}

function rowPredicate({ column, operation, value }: ChartFilter) {
  if (!column) return
  if (operation === 'matches') {
    const selected = Array.isArray(value) ? value : [value]
    const choices = new Set(selected.map(groupValue))
    choices.delete(undefined)
    if (choices.size)
      return (row: ChartRow) => choices.has(groupValue(read(row, column)))
  }
  if (operation === 'dateRange' && Array.isArray(value) && value.length === 2) {
    const start = periodStart(value[0], 'day')
    const end = periodStart(value[1], 'day')
    if (start === undefined || end === undefined || start > end) return
    return (row: ChartRow) => {
      const day = periodStart(read(row, column), 'day')
      return day !== undefined && day >= start && day <= end
    }
  }
}

export function filterChartRows(rows: ChartRow[], filters: ChartFilter[]) {
  const predicates = (Array.isArray(filters) ? filters : [])
    .filter(isChartRow)
    .map(rowPredicate)
    .filter((predicate) => predicate !== undefined)
  return predicates.length
    ? rows.filter(
        (row) => isChartRow(row) && predicates.every((match) => match(row)),
      )
    : rows
}
