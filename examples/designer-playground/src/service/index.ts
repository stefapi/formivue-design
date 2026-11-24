// Phase 7 (7.1) — service de persistance du playground, port verbatim de
// formivue/antd/playground/service (localStorage du schéma JSON). Seul écart :
// le toast `message.success` antd disparaît (V1) — le retour visuel du save
// est assuré par le ActionsWidget (indicateur « Saved », tokens V6).
import { Engine } from '@formivue-design/core'
import {
  transformToSchema,
  transformToTreeNode,
} from '@formivue-design/formivue-transformer'

export const STORAGE_KEY = 'formivue-vue-schema'

const storageKey = (advanced: boolean, profile: string) =>
  [STORAGE_KEY, advanced ? 'advanced' : '', profile].filter(Boolean).join('-')

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
) => {
  try {
    const storedSchema = localStorage.getItem(storageKey(advanced, profile))
    designer.setCurrentTree(
      transformToTreeNode(storedSchema ? JSON.parse(storedSchema) : undefined),
    )
    return !!storedSchema
  } catch {}
}
