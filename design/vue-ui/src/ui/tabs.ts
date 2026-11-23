// @formivue-design/vue-ui — ui/tabs + ui/collapsible — ports TS du registry
// shadcn-vue : TabsList/Trigger/Content, CollapsibleTrigger/Content.
import type { HTMLAttributes } from 'vue'
import { defineComponent, h } from 'vue'
import { ChevronRight } from '@lucide/vue'
import {
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'reka-ui'
import { cn } from '../lib/utils'

export const UiTabsList = defineComponent({
  name: 'UiTabsList',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        TabsList,
        {
          'data-slot': 'tabs-list',
          ...attrs,
          class: cn(
            'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-0.75',
            props.class,
          ) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})

export const UiTabsTrigger = defineComponent({
  name: 'UiTabsTrigger',
  inheritAttrs: false,
  props: {
    value: { type: [String, Number], required: true },
    disabled: { type: Boolean, default: false },
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        TabsTrigger,
        {
          'data-slot': 'tabs-trigger',
          value: props.value,
          disabled: props.disabled,
          ...attrs,
          class: cn(
            "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-3 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            props.class,
          ) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})

export const UiTabsContent = defineComponent({
  name: 'UiTabsContent',
  inheritAttrs: false,
  props: {
    value: { type: [String, Number], required: true },
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        TabsContent,
        {
          'data-slot': 'tabs-content',
          value: props.value,
          ...attrs,
          class: cn(
            'flex-1 outline-none',
            props.class,
          ) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})

export const UiCollapsible = CollapsibleRoot

export const UiCollapsibleTrigger = defineComponent({
  name: 'UiCollapsibleTrigger',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
    showChevron: { type: Boolean, default: true },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        CollapsibleTrigger,
        {
          'data-slot': 'collapsible-trigger',
          ...attrs,
          class: cn(
            'flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[state=open]:bg-accent/50 data-[state=open]:text-accent-foreground',
            props.class,
          ) as HTMLAttributes['class'],
        },
        {
          default: () => [
            props.showChevron &&
              h(ChevronRight, {
                class:
                  'text-muted-foreground size-4 transition-transform duration-200 data-[state=open]:rotate-90',
                'aria-hidden': 'true',
              }),
            slots.default?.(),
          ],
        },
      )
  },
})

export const UiCollapsibleContent = defineComponent({
  name: 'UiCollapsibleContent',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        CollapsibleContent,
        {
          'data-slot': 'collapsible-content',
          ...attrs,
          class: cn(
            'overflow-hidden outline-none data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
            props.class,
          ) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})
