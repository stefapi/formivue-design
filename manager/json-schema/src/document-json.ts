export type JsonValue =
  null | boolean | number | string | JsonObject | JsonValue[]
export interface JsonObject {
  [key: string]: JsonValue
}

export interface DataValidationDetails {
  keyword: string
  actual: unknown
  expected?: unknown
}

export interface DocumentIssue {
  path: string
  message: string
  component?: string
  componentId?: string
  property?: string
  code?: string
  severity?: 'error' | 'warning'
  constantMismatch?: { expected: JsonValue; actual: unknown }
  validationDetails?: DataValidationDetails
}

export class DocumentValidationError extends Error {
  constructor(readonly issues: readonly DocumentIssue[]) {
    super(
      issues
        .map(
          ({ path, message, component }) =>
            `${component ? `${component} ` : ''}${path || '/'}: ${message}`,
        )
        .join('\n'),
    )
    this.name = 'DocumentValidationError'
  }
}

export const isJsonObject = (value: unknown): value is JsonObject =>
  value !== null &&
  typeof value === 'object' &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null)

export const jsonPointer = (segments: readonly (string | number)[]) =>
  segments
    .map(
      (segment) =>
        '/' + String(segment).replaceAll('~', '~0').replaceAll('/', '~1'),
    )
    .join('')

export function pointerSegments(pointer: string): string[] {
  if (pointer === '') return []
  if (
    typeof pointer !== 'string' ||
    !pointer.startsWith('/') ||
    /~(?![01])/u.test(pointer)
  ) {
    throw new DocumentValidationError([
      { path: String(pointer), message: 'Invalid JSON Pointer' },
    ])
  }
  return pointer
    .slice(1)
    .split('/')
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'))
}

export function valueAt(value: unknown, path: readonly string[]): unknown {
  for (const key of path) {
    if (
      value === null ||
      typeof value !== 'object' ||
      (Array.isArray(value) && !/^(0|[1-9]\d*)$/u.test(key))
    )
      return undefined
    const entry = (value as Record<string, unknown>)[key]
    if (!Object.prototype.hasOwnProperty.call(value, key)) return undefined
    value = entry
  }
  return value
}

/** Adapt a row source to consumers whose column keys are flat. */
export function projectDocumentRows(
  value: unknown,
  columns: Readonly<Record<string, readonly string[]>>,
) {
  if (!Array.isArray(value) || !Object.keys(columns).length) return value
  return value.map((row) => {
    if (!isJsonObject(row)) return row
    const mapped = { ...row }
    for (const [key, path] of Object.entries(columns)) {
      const cell = valueAt(row, path)
      if (cell === undefined) delete mapped[key]
      else
        Object.defineProperty(mapped, key, {
          value: cell,
          enumerable: true,
          writable: true,
          configurable: true,
        })
    }
    return mapped
  })
}

// Formivue uses undefined when an optional field is cleared. JSON represents
// that by omitting the property. Other non-JSON values are rejected.
export function copyJson(value: unknown, omitUndefined = false): JsonValue {
  const ancestors = new Set<object>()
  function copy(value: unknown, path: string[]): JsonValue {
    const fail = (message: string): never => {
      throw new DocumentValidationError([{ path: jsonPointer(path), message }])
    }
    if (value === null) return null
    if (typeof value === 'boolean' || typeof value === 'string') return value
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (!Array.isArray(value) && !isJsonObject(value))
      return fail('Expected a JSON value')
    if (ancestors.has(value)) return fail('Circular JSON value')
    ancestors.add(value)
    let result: JsonValue
    if (Array.isArray(value)) {
      result = Array.from(value, (item, index) =>
        copy(item, [...path, String(index)]),
      )
    } else {
      result = Object.fromEntries(
        Object.entries(value).flatMap(([key, item]) => {
          if (omitUndefined && item === undefined) return []
          // These keys cannot be safely addressed by the Formivue path engine.
          if (
            key === '__proto__' ||
            key === 'constructor' ||
            key === 'prototype'
          )
            return fail(`Unsupported data key "${key}"`)
          return [[key, copy(item, [...path, key])]]
        }),
      )
    }
    ancestors.delete(value)
    return result
  }
  return copy(value, [])
}
