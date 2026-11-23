export type ChartRow = Record<string, unknown>
export type Category = string | number
export type Group = Category | boolean
export type Aggregation = 'sum' | 'mean'

export const isChartRow = (row: unknown): row is ChartRow =>
  !!row && typeof row === 'object' && !Array.isArray(row)

export const read = (row: ChartRow, key: string) =>
  key && row && Object.prototype.hasOwnProperty.call(row, key)
    ? row[key]
    : undefined

export const num = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

export const categoryValue = (value: unknown): Category | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value : num(value)

export const groupValue = (value: unknown): Group | undefined =>
  typeof value === 'boolean' ? value : categoryValue(value)

export const label = (value: unknown) => {
  const group = groupValue(value)
  return group === undefined ? undefined : String(group)
}

export function epoch(value: unknown) {
  const timestamp =
    value instanceof Date
      ? value.getTime()
      : typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)
        ? Date.parse(value)
        : num(value)
  return Number.isFinite(new Date(timestamp).getTime()) ? timestamp : undefined
}

export const orderedInterval = (start: number, end: number) => end > start

const coordinate = (value: unknown, limit: number) => {
  const number = num(value)
  return number !== undefined && Math.abs(number) <= limit ? number : undefined
}
export const latitude = (value: unknown) => coordinate(value, 90)
export const longitude = (value: unknown) => coordinate(value, 180)

export interface Total {
  sum: number
  count: number
}

export const addValue = (total: Total | undefined, value: number): Total => ({
  sum: (total?.sum ?? 0) + value,
  count: (total?.count ?? 0) + 1,
})

export const aggregateValue = (total: Total, aggregation: Aggregation) =>
  num(aggregation === 'mean' ? total.sum / total.count : total.sum)
