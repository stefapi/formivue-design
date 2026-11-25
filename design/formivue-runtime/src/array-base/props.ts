import { normalizeStyle } from 'vue'
import { raw } from '@formivue/reactive'

export const arrayOperations = ['Remove', 'Copy', 'MoveDown', 'MoveUp']

export const createArrayRowKeys = () => {
  const ids = new WeakMap<object, number>()
  let nextId = 0
  return (records: unknown[]) => {
    const occurrences = new Map<number, number>()
    return records.map((record, index) => {
      if (!record || typeof record !== 'object') return `position-${index}`
      const target = raw(record)
      const id = ids.get(target) ?? ++nextId
      ids.set(target, id)
      const occurrence = (occurrences.get(id) ?? 0) + 1
      occurrences.set(id, occurrence)
      return `record-${id}-${occurrence}`
    })
  }
}

export const arrayContainerProps = (
  attrs: Record<string, unknown>,
  className: string,
) => {
  const style = normalizeStyle([attrs.style])
  const display =
    typeof style === 'object' && typeof style.display === 'string'
      ? style.display
      : undefined
  return {
    ...Object.fromEntries(
      Object.entries(attrs).filter(
        ([name]) => name.startsWith('data-') || name.startsWith('aria-'),
      ),
    ),
    id: attrs.id,
    style: attrs.style,
    'data-array-inline': display?.startsWith('inline') ? '' : undefined,
    class: [
      className,
      'min-w-0 align-top gap-2',
      !display && 'flex flex-col',
      attrs.class,
    ],
  }
}
