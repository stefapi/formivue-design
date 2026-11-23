import { componentSchema, editor } from './shared'

export const InputOTP = componentSchema({
  length: editor('NumberPicker', { min: 1, max: 12 }),
  mask: editor('Switch'),
})
