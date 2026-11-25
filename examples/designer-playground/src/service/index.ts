// Phase 7 (7.1) — service de persistance du playground, port verbatim de
// formivue/antd/playground/service (localStorage du schéma JSON). Seul écart :
// le toast `message.success` antd disparaît (V1) — le retour visuel du save
// est assuré par le ActionsWidget (indicateur « Saved », tokens V6).
import type { Engine, ITreeNode } from '@formivue-design/core'
import type { DocumentProjectPersistence } from '@formivue-design/data-model'
import {
  filterDocumentCanvas,
  transformToSchema,
  transformToTreeNode,
} from '@formivue-design/formivue-transformer'

export const STORAGE_KEY = 'formivue-vue-schema'

export const localProjectPersistence = (
  key: string,
): DocumentProjectPersistence => ({
  read: () => localStorage.getItem(key),
  write: (state) => localStorage.setItem(key, state),
})

const storageKey = (advanced: boolean, profile: string) =>
  [STORAGE_KEY, advanced ? 'advanced' : '', profile].filter(Boolean).join('-')

export function saveCanvasSnapshot(
  canvas: ITreeNode,
  advanced: boolean,
  profile: string,
) {
  localStorage.setItem(
    storageKey(advanced, profile),
    JSON.stringify({ canvas }),
  )
}

export const saveSchema = (
  designer: Engine,
  advanced = false,
  profile = '',
) => {
  localStorage.setItem(
    storageKey(advanced, profile),
    JSON.stringify(transformToSchema(designer.getCurrentTree())),
  )
}

export const loadInitialSchema = (
  designer: Engine,
  advanced = false,
  profile = '',
  onError?: (error: unknown) => void,
) => {
  try {
    const storedSchema = localStorage.getItem(storageKey(advanced, profile))
    const saved = storedSchema ? JSON.parse(storedSchema) : undefined
    const tree = saved?.canvas
      ? filterDocumentCanvas(saved.canvas)
      : transformToTreeNode(saved)
    designer.setCurrentTree(tree)
    return !!storedSchema
  } catch (error) {
    onError?.(error)
  }
}
