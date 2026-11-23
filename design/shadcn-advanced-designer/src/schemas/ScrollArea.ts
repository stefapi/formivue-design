import { componentSchema, editor } from './shared'

export const ScrollArea = componentSchema({
  height: editor('NumberPicker', { min: 40 }),
  label: editor('Input'),
})
