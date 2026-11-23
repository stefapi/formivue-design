// @formivue-design/vue-ui — ui/dropdown-menu — port TS du registry shadcn-vue :
// DropdownMenuContent / Item / Separator.
import type { HTMLAttributes } from 'vue'
import { defineComponent, h } from 'vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from 'reka-ui'
import { cn } from '../lib/utils'

export const UiDropdownMenuContent = defineComponent({
  name: 'UiDropdownMenuContent',
  inheritAttrs: false,
  props: {
    sideOffset: { type: Number, default: 4 },
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        DropdownMenuPortal,
        {},
        {
          default: () =>
            h(
              DropdownMenuContent,
              {
                'data-slot': 'dropdown-menu-content',
                sideOffset: props.sideOffset,
                ...attrs,
                class: cn(
                  'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--reka-dropdown-menu-content-available-height) min-w-[8rem] origin-(--reka-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md',
                  props.class,
                ) as HTMLAttributes['class'],
              },
              slots,
            ),
        },
      )
  },
})

export const UiDropdownMenuItem = defineComponent({
  name: 'UiDropdownMenuItem',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
    variant: {
      type: String as () => 'default' | 'destructive',
      default: 'default',
    },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        DropdownMenuItem,
        {
          'data-slot': 'dropdown-menu-item',
          'data-variant': props.variant,
          ...attrs,
          class: cn(
            "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
            props.class,
          ) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})

export const UiDropdownMenuSeparator = defineComponent({
  name: 'UiDropdownMenuSeparator',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs }) {
    return () =>
      h(DropdownMenuSeparator, {
        'data-slot': 'dropdown-menu-separator',
        ...attrs,
        class: cn(
          'bg-border -mx-1 my-1 h-px',
          props.class,
        ) as HTMLAttributes['class'],
      })
  },
})
