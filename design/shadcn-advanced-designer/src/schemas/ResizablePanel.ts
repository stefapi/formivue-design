import { componentSchema, editor } from './shared'

export const ResizablePanel = componentSchema({
  title: editor('Input'),
  defaultSize: editor('NumberPicker', { min: 0, max: 100 }),
  minSize: editor('NumberPicker', { min: 0, max: 100 }),
  maxSize: editor('NumberPicker', { min: 0, max: 100 }),
})
