// @formivue-design/vue-ui — ui/button — port TS du composant Button du registry
// shadcn-vue (new-york-v4) : cva + Primitive reka-ui. Les SFC du registry ne
// passent pas le pipeline dts de tsdown → ports TS 1:1 (classes/variants
// identiques), composants possédés par ce package (règle shadcn).
import type { HTMLAttributes } from 'vue'
import { defineComponent, h } from 'vue'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import { Primitive } from 'reka-ui'
import { cn } from '../lib/utils'

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

// UiButton — le Button du registry : Primitive as/asChild + variants cva.
// (diffère du Button public `DButton` de vue-ui, qui garde le contrat
// form-friendly antd-like type/size/block par compat baseline)
export const UiButton = defineComponent({
  name: 'UiButton',
  inheritAttrs: false,
  props: {
    variant: {
      type: String as () => ButtonVariants['variant'],
      default: 'default',
    },
    size: {
      type: String as () => ButtonVariants['size'],
      default: 'default',
    },
    as: { type: [String, Object], default: 'button' },
    asChild: { type: Boolean, default: false },
    class: { type: null, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        Primitive,
        {
          'data-slot': 'button',
          'data-variant': props.variant as string,
          'data-size': props.size as string,
          ...attrs,
          as: props.as,
          asChild: props.asChild,
          type: (attrs.type as string) ?? 'button',
          class: cn(
            buttonVariants({ variant: props.variant, size: props.size }),
            props.class,
          ) as HTMLAttributes['class'],
        },
        slots,
      )
  },
})
