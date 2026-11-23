import { componentSchema, editor } from './shared'

export const Avatar = componentSchema({
  src: editor('Input'),
  alt: editor('Input'),
  fallback: editor('Input'),
  size: editor('NumberPicker', { min: 1 }),
})
