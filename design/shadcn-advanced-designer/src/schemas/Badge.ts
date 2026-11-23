import { componentSchema, editor } from './shared'

export const Badge = componentSchema({
  text: editor('Input'),
  variant: editor(['default', 'secondary', 'outline', 'destructive']),
})
