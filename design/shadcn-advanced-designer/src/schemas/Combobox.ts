import { componentSchema, editor } from './shared'

export const Combobox = componentSchema({
  placeholder: editor('Input'),
  emptyText: editor('Input'),
})
