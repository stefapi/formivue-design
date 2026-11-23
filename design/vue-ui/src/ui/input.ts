// @formivue-design/vue-ui — ui/input — port TS du registry shadcn-vue :
// Input.vue + Textarea.vue (classes identiques).
import type { HTMLAttributes } from 'vue'
import { defineComponent, h } from 'vue'
import { cn } from '../lib/utils'

const inputClasses = [
  'border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30',
  'flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs',
  'transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
  'file:text-foreground md:text-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3',
  'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
]

export const UiInput = defineComponent({
  name: 'UiInput',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs }) {
    return () =>
      h('input', {
        'data-slot': 'input',
        ...attrs,
        class: cn(inputClasses, props.class) as HTMLAttributes['class'],
      })
  },
})

const textareaClasses = [
  'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
  'flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow]',
  'outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
  'aria-invalid:border-destructive dark:bg-input/30',
]

export const UiTextarea = defineComponent({
  name: 'UiTextarea',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs }) {
    return () =>
      h('textarea', {
        'data-slot': 'textarea',
        ...attrs,
        class: cn(textareaClasses, props.class) as HTMLAttributes['class'],
      })
  },
})
