// @formivue-design/vue-ui — ui/dialog — port TS du registry shadcn-vue :
// DialogOverlay + DialogContent (fermeture X lucide).
import type { HTMLAttributes } from 'vue'
import { defineComponent, h } from 'vue'
import { X } from '@lucide/vue'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from 'reka-ui'
import { cn } from '../lib/utils'

export const UiDialogOverlay = defineComponent({
  name: 'UiDialogOverlay',
  setup() {
    return () =>
      h(DialogOverlay, {
        'data-slot': 'dialog-overlay',
        class: cn(
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        ),
        'aria-hidden': 'true',
      })
  },
})

export const UiDialogContent = defineComponent({
  name: 'UiDialogContent',
  inheritAttrs: false,
  props: {
    class: { type: null, default: undefined },
    showCloseButton: { type: Boolean, default: true },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        DialogPortal,
        {},
        {
          default: () => [
            h(UiDialogOverlay),
            h(
              DialogContent,
              {
                'data-slot': 'dialog-content',
                ...attrs,
                class: cn(
                  'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200',
                  props.class,
                ) as HTMLAttributes['class'],
              },
              {
                default: () => [
                  slots.default?.(),
                  props.showCloseButton &&
                    h(
                      DialogClose,
                      {
                        'data-slot': 'dialog-close',
                        type: 'button',
                        'aria-label': 'Close',
                        class:
                          'ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
                      },
                      {
                        default: () => [
                          h(X, {}),
                          h('span', { class: 'sr-only' }, 'Close'),
                        ],
                      },
                    ),
                ],
              },
            ),
          ],
        },
      )
  },
})
