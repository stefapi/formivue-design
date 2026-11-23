// @formivue-design/vue-ui — ui/tooltip + ui/popover — ports TS du registry
// shadcn-vue : Tooltip (Provider/Trigger/Content + flèche) et Popover.
import type { HTMLAttributes } from 'vue'
import { defineComponent, h } from 'vue'
import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'
import { cn } from '../lib/utils'

export const UiTooltipProvider = TooltipProvider

export const UiTooltipTrigger = defineComponent({
  name: 'UiTooltipTrigger',
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: false },
  },
  setup(props, { attrs, slots }) {
    return () => h(TooltipTrigger, { asChild: props.asChild, ...attrs }, slots)
  },
})

export const UiTooltipContent = defineComponent({
  name: 'UiTooltipContent',
  inheritAttrs: false,
  props: {
    sideOffset: { type: Number, default: 4 },
    class: { type: null, default: undefined },
    showArrow: { type: Boolean, default: true },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        TooltipPortal,
        {},
        {
          default: () =>
            h(
              TooltipContent,
              {
                'data-slot': 'tooltip-content',
                sideOffset: props.sideOffset,
                ...attrs,
                class: cn(
                  'bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit rounded-md px-3 py-1.5 text-xs text-balance',
                  props.class,
                ) as HTMLAttributes['class'],
              },
              {
                default: () => [
                  slots.default?.(),
                  props.showArrow &&
                    h(TooltipArrow, {
                      class:
                        'fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-xs',
                      'aria-hidden': 'true',
                    }),
                ],
              },
            ),
        },
      )
  },
})

// assemblage racine shadcn : Tooltip = Root + (slot trigger) + Content
export const UiTooltip = defineComponent({
  name: 'UiTooltip',
  props: {
    delayDuration: { type: Number, default: 300 },
    defaultOpen: { type: Boolean, default: false },
    open: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () =>
      h(
        UiTooltipProvider,
        { delayDuration: props.delayDuration },
        {
          default: () =>
            h(
              TooltipRoot,
              { defaultOpen: props.defaultOpen, open: props.open },
              {
                default: () =>
                  props.disabled
                    ? slots.default?.()
                    : [
                        slots.trigger?.() ?? slots.default?.(),
                        slots.content
                          ? h(
                              UiTooltipContent,
                              {},
                              { default: () => slots.content?.() },
                            )
                          : null,
                      ],
              },
            ),
        },
      )
  },
})

export const UiPopover = defineComponent({
  name: 'UiPopover',
  inheritAttrs: false,
  props: {
    open: { type: Boolean, default: undefined },
    title: { type: String, default: undefined },
    align: {
      type: String as () => 'start' | 'center' | 'end',
      default: undefined,
    },
    sideOffset: { type: Number, default: undefined },
    class: { type: null, default: undefined },
  },
  emits: ['update:open'],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        PopoverRoot,
        {
          open: props.open,
          'onUpdate:open': (o: boolean) => emit('update:open', o),
        },
        {
          default: () => [
            h(
              PopoverTrigger,
              { asChild: true },
              { default: () => slots.default?.() },
            ),
            h(
              PopoverPortal,
              {},
              {
                default: () =>
                  h(
                    PopoverContent,
                    {
                      'data-slot': 'popover-content',
                      align: props.align ?? 'center',
                      sideOffset: props.sideOffset ?? 4,
                      ...attrs,
                      class: cn(
                        'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 max-w-(--reka-popover-content-available-width) rounded-md border p-4 shadow-md outline-hidden',
                        props.class,
                      ) as HTMLAttributes['class'],
                    },
                    {
                      default: () => [
                        props.title
                          ? h(
                              'div',
                              {
                                class:
                                  'mb-2 text-sm font-medium text-foreground',
                              },
                              props.title,
                            )
                          : null,
                        slots.content?.(),
                      ],
                    },
                  ),
              },
            ),
          ],
        },
      )
  },
})
