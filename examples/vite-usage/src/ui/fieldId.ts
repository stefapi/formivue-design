import type { GeneralField } from '@formivue/core'

/** Stable DOM id derived from the formivue address (shared label <-> control). */
export function fieldId(field?: GeneralField | null): string | undefined {
  if (!field) return undefined
  return `f-${field.form.id}-${field.address.toString().replace(/[^\w-]/g, '-')}`
}
