import { isEqual } from '@formivue/shared'
import {
  copyJson,
  DocumentValidationError,
  isJsonObject,
  pointerSegments,
  valueAt,
  type JsonValue,
} from './document-json'

export type JsonPatchOperation =
  | { op: 'add' | 'replace' | 'test'; path: string; value: JsonValue }
  | { op: 'remove'; path: string }
  | { op: 'move' | 'copy'; from: string; path: string }

export function applyJsonPatch(
  data: JsonValue,
  operations: readonly JsonPatchOperation[],
) {
  if (!Array.isArray(operations))
    throw new DocumentValidationError([
      { path: '', message: 'Expected JSON Patch operations' },
    ])
  let candidate = copyJson(data)
  for (const operation of operations) {
    if (!isJsonObject(operation) || typeof operation.path !== 'string')
      throw new DocumentValidationError([
        { path: '', message: 'Invalid JSON Patch operation' },
      ])
    const pointer = operation.path
    const path = pointerSegments(pointer)
    const fail = (message: string): never => {
      throw new DocumentValidationError([{ path: pointer, message }])
    }
    const read = (segments: string[]) => {
      const value = valueAt(candidate, segments)
      if (value === undefined) return fail('Patch target does not exist')
      return value as JsonValue
    }
    const write = (
      op: 'add' | 'replace' | 'remove',
      segments: string[],
      value?: JsonValue,
    ) => {
      const key = segments[segments.length - 1]
      if (key === undefined) {
        if (op === 'remove') return fail('Cannot remove the data document')
        candidate = value
        return
      }
      if (key === '__proto__' || key === 'constructor' || key === 'prototype')
        return fail('Unsupported data key')
      const parent = read(segments.slice(0, -1))
      if (Array.isArray(parent)) {
        const index = op === 'add' && key === '-' ? parent.length : Number(key)
        if (
          (!/^(0|[1-9]\d*)$/u.test(key) && !(key === '-' && op === 'add')) ||
          !Number.isSafeInteger(index) ||
          index > parent.length ||
          (index === parent.length && op !== 'add')
        )
          return fail('Invalid array index')
        if (op === 'remove') parent.splice(index, 1)
        else if (op === 'add') parent.splice(index, 0, value)
        else parent[index] = value
      } else if (isJsonObject(parent)) {
        if (op !== 'add' && !Object.prototype.hasOwnProperty.call(parent, key))
          return fail('Patch target does not exist')
        if (op === 'remove') delete parent[key]
        else parent[key] = value
      } else {
        return fail('Patch target parent is not an object or array')
      }
    }
    switch (operation.op) {
      case 'add':
      case 'replace':
        write(operation.op, path, copyJson(operation.value))
        break
      case 'remove':
        write('remove', path)
        break
      case 'test':
        if (!isEqual(read(path), copyJson(operation.value)))
          fail('Patch test failed')
        break
      case 'move':
      case 'copy': {
        if (typeof operation.from !== 'string')
          fail('Patch source must be a JSON Pointer')
        const from = pointerSegments(operation.from as string)
        const value = copyJson(read(from))
        if (operation.op === 'move') {
          if (isEqual(from, path)) break
          if (
            from.length < path.length &&
            from.every((key, index) => key === path[index])
          )
            fail('Cannot move a value into its own child')
          write('remove', from)
        }
        write('add', path, value)
        break
      }
      default:
        fail('Unknown patch operation')
    }
  }
  return candidate
}
