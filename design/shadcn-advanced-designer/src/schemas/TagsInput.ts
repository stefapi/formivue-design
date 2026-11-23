import { componentSchema, editor } from './shared'

export const TagsInput = componentSchema({
  placeholder: editor('Input'),
  max: editor('NumberPicker', { min: 1 }),
  delimiter: editor('Input'),
})
