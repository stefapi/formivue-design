import { componentSchema, editor } from './shared'

export const Drawer = componentSchema({
  title: editor('Input'),
  description: editor('Input.TextArea'),
  triggerText: editor('Input'),
  closeText: editor('Input'),
  defaultOpen: editor('Switch'),
})
