import { componentSchema, editor } from './shared'

export const HoverCard = componentSchema({
  triggerText: editor('Input'),
  title: editor('Input'),
  message: editor('Input.TextArea'),
  href: editor('Input'),
})
