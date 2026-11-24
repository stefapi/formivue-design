import { chartLanguageIndex } from './locale'
import { epoch } from './row-data'

export type DatePeriod = 'none' | 'day' | 'week' | 'month'

export const isDatePeriod = (
  period?: DatePeriod,
): period is Exclude<DatePeriod, 'none'> =>
  period === 'day' || period === 'week' || period === 'month'

function chartDate(value: unknown) {
  if (typeof value !== 'string') return epoch(value)
  const match =
    /^(\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.exec(
      value,
    )
  if (!match) return undefined

  const day = new Date(match[1])
  if (
    !Number.isFinite(day.getTime()) ||
    day.toISOString().slice(0, 10) !== match[1]
  )
    return undefined

  // Treat timezone-free date and time values from the designer as UTC.
  return epoch(value.includes('T') && !match[2] ? `${value}Z` : value)
}

export function periodStart(
  value: unknown,
  period: Exclude<DatePeriod, 'none'>,
) {
  const timestamp = chartDate(value)
  if (timestamp === undefined) return undefined
  const date = new Date(timestamp)
  date.setUTCHours(0, 0, 0, 0)
  if (period === 'month') date.setUTCDate(1)
  if (period === 'week')
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7))
  const start = date.getTime()
  return Number.isFinite(start) ? start : undefined
}

export function periodFormatter(
  period: Exclude<DatePeriod, 'none'>,
  locale?: string,
) {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    ...(period === 'month' ? {} : { day: 'numeric' }),
  })
  const weekOf = ['Week of', 'Sem. du', 'Semana del'][
    chartLanguageIndex(locale)
  ]
  return (start: number) => {
    const date = formatter.format(start)
    return period === 'week' ? `${weekOf} ${date}` : date
  }
}
