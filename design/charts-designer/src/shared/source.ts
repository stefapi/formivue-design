import type { TreeNode } from '@formivue-design/core'
import { periodStart } from '@formivue-design/charts-runtime'

interface Column {
  key: string
  title: string
  numeric?: boolean
  date?: boolean
}

interface ArrayTableSource {
  expression: string
  title: string
  node: TreeNode
}

export const arrayTableSources = (
  chart: TreeNode | undefined,
  rename?: { field: TreeNode; previousKey: string },
) => {
  const sources: ArrayTableSource[] = []
  const visit = (node: TreeNode, path: string[]) => {
    for (const child of node.children) {
      if (child.componentName !== 'Field') continue
      const key =
        child === rename?.field
          ? rename.previousKey
          : child.props.name || child.id
      const next = child.props.type === 'void' ? path : [...path, key]
      if (child.props.type === 'array') {
        if (child.props['x-component'] === 'ArrayTable') {
          sources.push({
            expression: `{{ $form.getValuesIn(${JSON.stringify(next)}) }}`,
            title: child.props.title
              ? `${child.props.title} (${next.join('.')})`
              : next.join('.'),
            node: child,
          })
        }
      } else if (child.props.type === 'object' || child.props.type === 'void') {
        visit(child, next)
      }
    }
  }
  if (chart) visit(chart.root, [])
  return sources
}

export const chartSource = (rows: unknown, sources: ArrayTableSource[]) => {
  const linked = sources.find(({ expression }) => expression === rows)
  const data = linked ? linked.node.props.default : rows
  const entries: unknown[] = Array.isArray(data) ? data : []
  return {
    linked,
    rows: entries,
    unresolved: !linked && typeof rows === 'string' && rows.trim() !== '',
    records: entries.filter(
      (row): row is Record<string, unknown> =>
        row && typeof row === 'object' && !Array.isArray(row),
    ),
  }
}

export const arrayTableColumns = (table: TreeNode | undefined) => {
  const fields: TreeNode[] = []
  const visit = (node: TreeNode) => {
    for (const field of node.children) {
      if (field.componentName !== 'Field') continue
      if (field.props.type === 'void') {
        visit(field)
      } else if (
        ['string', 'number', 'integer', 'boolean'].includes(field.props.type)
      ) {
        fields.push(field)
      }
    }
  }
  const rowTemplate = table?.children[0]
  if (rowTemplate) visit(rowTemplate)
  return fields
}

export const hasChartColumn = (
  source: ReturnType<typeof chartSource>,
  key: string,
) =>
  source.linked
    ? arrayTableColumns(source.linked.node).some(
        (field) => (field.props.name || field.id) === key,
      )
    : !source.records.length ||
      source.records.some((record) =>
        Object.prototype.hasOwnProperty.call(record, key),
      )

export const chartColumns = (source: ReturnType<typeof chartSource>) => {
  const columns = new Map<string, Column>()
  const sample = source.records.slice(0, 50)
  const dates = new Set<string>()
  for (const row of sample) {
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'string' && periodStart(value, 'day') !== undefined)
        dates.add(key)
    }
  }
  for (const field of arrayTableColumns(source.linked?.node)) {
    const key = field.props.name || field.id
    columns.set(key, {
      key,
      title: field.props.title || key,
      numeric: ['number', 'integer'].includes(field.props.type),
      date:
        field.props['x-component'] === 'DatePicker' ||
        ['date', 'date-time'].includes(field.props.format) ||
        dates.has(key),
    })
  }

  if (source.linked) return [...columns.values()]

  const inferred = new Map<string, boolean | undefined>()
  for (const record of sample) {
    for (const [key, item] of Object.entries(record)) {
      if (columns.has(key)) continue
      if (item == null) {
        if (!inferred.has(key)) inferred.set(key, undefined)
        continue
      }
      const numeric = typeof item === 'number' && Number.isFinite(item)
      inferred.set(key, (inferred.get(key) ?? true) && numeric)
    }
  }
  for (const [key, numeric] of inferred)
    columns.set(key, { key, title: key, numeric, date: dates.has(key) })
  return [...columns.values()]
}

export function updateChartLink(
  chart: TreeNode,
  field: TreeNode,
  previousKey: string,
) {
  const props = chart.props['x-component-props']
  if (typeof props?.rows !== 'string') return
  const source = arrayTableSources(chart, { field, previousKey }).find(
    ({ expression }) => expression === props.rows,
  )
  if (!source) return

  const updatedSource = arrayTableSources(chart).find(
    ({ node }) => node === source.node,
  )
  if (source.expression !== updatedSource.expression)
    props.rows = updatedSource.expression
  if (!arrayTableColumns(source.node).includes(field)) return

  const key = field.props.name || field.id
  for (const property of [
    'xKey',
    'groupKey',
    'valueKey',
    'sourceKey',
    'targetKey',
    'startKey',
    'endKey',
    'latitudeKey',
    'longitudeKey',
    'destinationLatitudeKey',
    'destinationLongitudeKey',
  ]) {
    if (props[property] === previousKey) props[property] = key
  }
  if (Array.isArray(props.series)) {
    for (const series of props.series) {
      if (series?.key === previousKey) series.key = key
    }
  }

  const rows = source.node.props.default
  if (!Array.isArray(rows)) return
  let changed = false
  const renamedRows = rows.map((row) => {
    if (
      !row ||
      typeof row !== 'object' ||
      Array.isArray(row) ||
      !Object.prototype.hasOwnProperty.call(row, previousKey) ||
      Object.prototype.hasOwnProperty.call(row, key)
    )
      return row
    const renamed = { ...row, [key]: row[previousKey] }
    delete renamed[previousKey]
    changed = true
    return renamed
  })
  if (changed) {
    source.node.props.default = renamedRows
  }
}
