import { componentSchema, editor } from './shared'

export const Carousel = componentSchema({
  label: editor('Input'),
  previousText: editor('Input'),
  nextText: editor('Input'),
  loop: editor('Switch'),
})
