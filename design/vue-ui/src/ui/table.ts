// @formivue-design/vue-ui — ui/table — port TS du registry shadcn-vue : Table,
// TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty.
import type { HTMLAttributes } from 'vue'
import { defineComponent, h } from 'vue'
import { cn } from '../lib/utils'

export const UiTable = defineComponent({
  name: 'UiTable',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'div',
        {
          'data-slot': 'table-container',
          class: 'relative w-full overflow-x-auto',
        },
        h(
          'table',
          {
            'data-slot': 'table',
            ...attrs,
            class: cn(
              'w-full caption-bottom text-sm',
              props.class,
            ) as HTMLAttributes['class'],
          },
          slots,
        ),
      )
  },
})

export const UiTableHeader = defineComponent({
  name: 'UiTableHeader',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'thead',
        {
          'data-slot': 'table-header',
          ...attrs,
          class: cn('[&_tr]:border-b', props.class) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})

export const UiTableBody = defineComponent({
  name: 'UiTableBody',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'tbody',
        {
          'data-slot': 'table-body',
          ...attrs,
          class: cn(
            '[&_tr:last-child]:border-0',
            props.class,
          ) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})

export const UiTableRow = defineComponent({
  name: 'UiTableRow',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'tr',
        {
          'data-slot': 'table-row',
          ...attrs,
          class: cn(
            'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
            props.class,
          ) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})

export const UiTableHead = defineComponent({
  name: 'UiTableHead',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'th',
        {
          'data-slot': 'table-head',
          ...attrs,
          class: cn(
            'text-foreground h-10 px-2 text-left whitespace-nowrap align-middle font-medium [&:has([role=checkbox])]:pr-0',
            props.class,
          ) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})

export const UiTableCell = defineComponent({
  name: 'UiTableCell',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'td',
        {
          'data-slot': 'table-cell',
          ...attrs,
          class: cn(
            'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0',
            props.class,
          ) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})
