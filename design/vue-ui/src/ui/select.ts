// @formivue-design/vue-ui — ui/select — port TS du registry shadcn-vue :
// SelectTrigger / SelectContent / SelectItem / SelectValue (icônes lucide).
import type { HTMLAttributes } from 'vue'
import { defineComponent, h } from 'vue'
import { Check, ChevronDown, ChevronUp } from '@lucide/vue'
import {
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { cn } from '../lib/utils'

export const UiSelectTrigger = defineComponent({
  name: 'UiSelectTrigger',
  inheritAttrs: false,
  props: {
    size: {
      type: String as () => 'sm' | 'default',
      default: 'default',
    },
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        SelectTrigger,
        {
          'data-slot': 'select-trigger',
          'data-size': props.size,
          ...attrs,
          class: cn(
            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            props.class,
          ) as HTMLAttributes['class'],
        },
        {
          default: () => [
            slots.default?.(),
            h(
              SelectIcon,
              { asChild: true },
              { default: () => h(ChevronDown, { class: 'size-4 opacity-50' }) },
            ),
          ],
        },
      )
  },
})

export const UiSelectValue = SelectValue

export const UiSelectContent = defineComponent({
  name: 'UiSelectContent',
  inheritAttrs: false,
  props: {
    position: {
      type: String as () => 'item-aligned' | 'popper',
      default: 'popper',
    },
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        SelectPortal,
        {},
        {
          default: () =>
            h(
              SelectContent,
              {
                'data-slot': 'select-content',
                ...attrs,
                position: props.position,
                class: cn(
                  'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--reka-select-content-available-height) min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border shadow-md',
                  props.position === 'popper' &&
                    'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
                  props.class,
                ) as HTMLAttributes['class'],
              },
              {
                default: () => [
                  h(UiSelectScrollUpButton),
                  h(
                    SelectViewport,
                    {
                      class: cn(
                        'p-1',
                        props.position === 'popper' &&
                          'h-(--reka-select-trigger-height) w-full min-w-(--reka-select-trigger-width) scroll-my-1',
                      ),
                    },
                    slots,
                  ),
                  h(UiSelectScrollDownButton),
                ],
              },
            ),
        },
      )
  },
})

const scrollButtonClasses =
  'flex cursor-default items-center justify-center py-1'

const UiSelectScrollUpButton = defineComponent({
  name: 'UiSelectScrollUpButton',
  setup() {
    return () =>
      h(
        SelectScrollUpButton,
        { 'data-slot': 'select-scroll-up-button', class: scrollButtonClasses },
        {
          default: () => h(ChevronUp, { class: 'size-4' }),
        },
      )
  },
})

const UiSelectScrollDownButton = defineComponent({
  name: 'UiSelectScrollDownButton',
  setup() {
    return () =>
      h(
        SelectScrollDownButton,
        {
          'data-slot': 'select-scroll-down-button',
          class: scrollButtonClasses,
        },
        { default: () => h(ChevronDown, { class: 'size-4' }) },
      )
  },
})

export const UiSelectGroup = SelectGroup

export const UiSelectItem = defineComponent({
  name: 'UiSelectItem',
  inheritAttrs: false,
  props: {
    value: { type: null, required: true },
    disabled: { type: Boolean, default: false },
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        SelectItem,
        {
          'data-slot': 'select-item',
          value: props.value,
          disabled: props.disabled,
          ...attrs,
          class: cn(
            "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
            props.class,
          ) as HTMLAttributes['class'],
        },
        {
          default: () => [
            h(
              'span',
              {
                class:
                  'absolute right-2 flex size-3.5 items-center justify-center',
              },
              [
                h(
                  SelectItemIndicator,
                  {},
                  {
                    default: () =>
                      (slots as any)['indicator-icon']?.() ??
                      h(Check, { class: 'size-4' }),
                  },
                ),
              ],
            ),
            h(SelectItemText, {}, { default: () => slots.default?.() }),
          ],
        },
      )
  },
})
