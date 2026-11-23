import type { ChartOptions } from './base'

import {
  addValue,
  aggregateValue,
  label,
  num,
  read,
  type Total,
} from './row-data'

export function categoryOrder(
  values: Iterable<string>,
  order: ChartOptions['categoryOrder'],
) {
  const categories = [...values]
  if (order === 'source') return categories
  const collator = new Intl.Collator(undefined, { numeric: true })
  return categories.sort((a, b) =>
    order === 'ascending' ? collator.compare(a, b) : collator.compare(b, a),
  )
}

export function pairs(
  options: Pick<ChartOptions, 'rows' | 'valueKey' | 'aggregation'>,
  firstKey: string,
  secondKey: string,
  defaultWeight?: number,
  firstLabel = label,
) {
  const results = new Map<string, { first: string; second: string } & Total>()
  for (const row of options.rows) {
    const first = firstLabel(read(row, firstKey))
    const second = secondKey ? label(read(row, secondKey)) : ''
    const value = options.valueKey
      ? num(read(row, options.valueKey))
      : defaultWeight
    if (first === undefined || second === undefined || value === undefined)
      continue
    const key = JSON.stringify([first, second])
    results.set(key, { first, second, ...addValue(results.get(key), value) })
  }
  return Array.from(results, ([id, total]) => ({
    id,
    first: total.first,
    second: total.second,
    value: aggregateValue(total, options.aggregation),
  })).filter(({ value }) => value !== undefined)
}

export function hasFlowCycle(links: { source: string; target: string }[]) {
  const incoming = new Map<string, number>()
  const successors = new Map<string, string[]>()
  for (const { source, target } of links) {
    incoming.set(source, incoming.get(source) ?? 0)
    incoming.set(target, (incoming.get(target) ?? 0) + 1)
    const next = successors.get(source)
    if (next) next.push(target)
    else successors.set(source, [target])
  }
  const ready = [...incoming.keys()].filter((id) => incoming.get(id) === 0)
  for (let i = 0; i < ready.length; i++) {
    for (const next of successors.get(ready[i]) ?? []) {
      const count = incoming.get(next) - 1
      incoming.set(next, count)
      if (!count) ready.push(next)
    }
  }
  return ready.length < incoming.size
}

export function distribution(samples: number[]) {
  samples.sort((a, b) => a - b)
  const quantile = (fraction: number) => {
    const position = fraction * (samples.length - 1)
    const index = Math.floor(position)
    return (
      samples[index] +
      (samples[Math.ceil(position)] - samples[index]) * (position - index)
    )
  }
  return {
    median: quantile(0.5),
    quartiles: [quantile(0.25), quantile(0.75)] as [number, number],
    whiskers: [samples[0], samples[samples.length - 1]] as [number, number],
  }
}
