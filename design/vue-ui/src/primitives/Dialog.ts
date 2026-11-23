// @formivue-design/vue-ui — primitives — Dialog (sur le Dialog shadcn-vue :
// Overlay + Content + fermeture X lucide). Forme Modal antd-like conservée :
// open/onOpenChange + title/description/closable/width + slots
// trigger/default/footer.
import { defineComponent, h, type PropType } from 'vue'
import {
  DialogDescription,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'
import { UiDialogContent } from '../ui/dialog'
import { cn } from '../lib/utils'

export const Dialog = defineComponent({
  name: 'DDialog',
  inheritAttrs: false,
  props: {
    open: { type: Boolean, default: undefined },
    title: { type: String, default: undefined },
    description: { type: String, default: undefined },
    closable: { type: Boolean, default: true },
    width: {
      type: [Number, String] as PropType<number | string>,
      default: 520,
    },
  },
  emits: ['update:open', 'cancel'],
  setup(props, { attrs, slots, emit }) {
    const close = (v: boolean) => {
      emit('update:open', v)
      if (!v) emit('cancel')
    }
    return () =>
      h(
        DialogRoot,
        { open: props.open, 'onUpdate:open': close },
        {
          default: () => [
            slots.trigger
              ? h(
                  DialogTrigger,
                  { asChild: true },
                  { default: () => slots.trigger?.() },
                )
              : null,
            h(
              DialogPortal,
              {},
              {
                default: () =>
                  h(
                    UiDialogContent,
                    {
                      ...attrs,
                      // sans Description, reka laisse un aria-describedby pointant
                      // vers un id inexistant → on le retire explicitement (axe)
                      'aria-describedby': props.description ? undefined : null,
                      showCloseButton: props.closable,
                      class: cn('gap-2', attrs.class),
                      style: {
                        width: `${props.width}px`,
                        ...((attrs.style as object) ?? {}),
                      },
                    },
                    {
                      default: () => [
                        props.title
                          ? h(
                              DialogTitle,
                              {
                                class:
                                  'text-lg leading-none font-semibold text-foreground',
                              },
                              { default: () => props.title },
                            )
                          : h(
                              DialogTitle,
                              { class: 'sr-only' },
                              {
                                default: () => slots.title?.() ?? 'dialog',
                              },
                            ),
                        props.description
                          ? h(
                              DialogDescription,
                              {
                                class: 'text-sm text-muted-foreground',
                              },
                              { default: () => props.description },
                            )
                          : null,
                        h(
                          'div',
                          { class: 'text-sm text-foreground' },
                          slots.default?.(),
                        ),
                        slots.footer
                          ? h(
                              'footer',
                              {
                                class: 'mt-2 flex flex-wrap justify-end gap-2',
                              },
                              slots.footer?.(),
                            )
                          : null,
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
