import { componentSchema, editor } from './shared'

export const Resizable = componentSchema({
  direction: editor(['horizontal', 'vertical']),
  height: editor('NumberPicker', { min: 40 }),
  handleLabel: editor('Input'),
})
