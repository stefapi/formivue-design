// @formivue-design/vue-ui — primitives — Tooltip / Popover (sur le Tooltip et
// le Popover shadcn-vue, trigger par slot).
// Contrat public conservé : Tooltip {content, delay} + slots default/content ;
// Popover {title, open} + slots default(trigger)/content.
import { defineComponent, h } from 'vue'
import { UiPopover, UiTooltipContent, UiTooltipProvider } from '../ui/tooltip'
import { TooltipRoot, TooltipTrigger } from 'reka-ui'

export const Tooltip = defineComponent({
  name: 'DTooltip',
  inheritAttrs: false,
  props: {
    content: { type: String, default: undefined },
    delay: { type: Number, default: 300 },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        UiTooltipProvider,
        { delayDuration: props.delay },
        {
          default: () =>
            h(
              TooltipRoot,
              {},
              {
                default: () => [
                  h(
                    TooltipTrigger,
                    { ...attrs, asChild: true },
                    { default: () => slots.default?.() },
                  ),
                  h(
                    UiTooltipContent,
                    {},
                    {
                      default: () => slots.content?.() ?? props.content,
                    },
                  ),
                ],
              },
            ),
        },
      )
  },
})

export const Popover = defineComponent({
  name: 'DPopover',
  inheritAttrs: false,
  props: {
    open: { type: Boolean, default: undefined },
    title: { type: String, default: undefined },
  },
  emits: ['update:open'],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        UiPopover,
        {
          open: props.open,
          title: props.title,
          ...attrs,
          'onUpdate:open': (o: boolean) => emit('update:open', o),
        },
        {
          default: () => slots.default?.(),
          content: () => slots.content?.(),
        },
      )
  },
})
