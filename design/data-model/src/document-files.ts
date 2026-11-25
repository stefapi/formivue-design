import type { FormDocuments } from '@formivue-design/formivue-transformer'
import { isJsonObject } from '@formivue/json-schema'

export const formDocumentFileNames = {
  ui: 'ui.json',
  dataSchema: 'data.schema.json',
  data: 'data.json',
} as const satisfies Record<keyof FormDocuments, string>

function sameJson(left: unknown, right: unknown): boolean {
  if (left === right) return true
  if (Array.isArray(left) && Array.isArray(right))
    return (
      left.length === right.length &&
      left.every((value, index) => sameJson(value, right[index]))
    )
  if (!isJsonObject(left) || !isJsonObject(right)) return false
  const ownKeys = (value: Record<string, unknown>) =>
    Object.keys(value).filter((key) => value[key] !== undefined)
  const keys = ownKeys(left)
  return (
    keys.length === ownKeys(right).length &&
    keys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(right, key) &&
        sameJson(left[key], right[key]),
    )
  )
}

export function hasSameFormDocumentDefinition(
  previous: FormDocuments,
  next: FormDocuments,
) {
  return (
    sameJson(previous.ui, next.ui) &&
    sameJson(previous.dataSchema, next.dataSchema)
  )
}
