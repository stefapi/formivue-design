import { Button, Dialog, Tabs } from '@formivue-design/vue-ui'
import { defineComponent, h, nextTick, ref, watch, type PropType } from 'vue'
import type { Message } from './keywords'

const sections = {
  validation: ['Validation', 'Validation', 'Validación'],
  general: ['General', 'Général', 'General'],
  bindings: ['Bindings', 'Liaisons', 'Vínculos'],
  advanced: ['Advanced', 'Avancé', 'Avanzado'],
} satisfies Record<string, Message>

export type SettingsSection = keyof typeof sections

export const FieldSettings = defineComponent({
  props: {
    open: Boolean,
    title: { type: String, required: true },
    path: String,
    typeLabel: String,
    section: { type: String as PropType<SettingsSection>, required: true },
    hasBindings: Boolean,
    back: Function as PropType<() => void>,
    restoreFocus: Function as PropType<() => void>,
    t: {
      type: Function as PropType<(message: Message) => string>,
      required: true,
    },
  },
  emits: ['close', 'update:section'],
  setup(props, { slots, emit }) {
    const heading = ref<HTMLElement>()
    watch(
      () => props.path,
      () => {
        if (props.open)
          void nextTick(() => heading.value?.focus({ preventScroll: true }))
      },
    )
    return () => {
      const tabs = (Object.keys(sections) as SettingsSection[])
        .filter((key) => key !== 'bindings' || props.hasBindings)
        .map((key) => ({ key, label: props.t(sections[key]) }))
      const active = tabs.some(({ key }) => key === props.section)
        ? props.section
        : 'validation'
      const close = props.t([
        'Close settings',
        'Fermer les réglages',
        'Cerrar ajustes',
      ])
      return h(
        Dialog,
        {
          open: props.open,
          closable: false,
          class:
            'schema-field-settings inset-y-0 right-0 left-auto h-dvh max-w-none translate-x-0 translate-y-0 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-0 overflow-hidden rounded-none border-y-0 border-r-0 p-0 [&>div]:min-h-0',
          style: { width: 'min(100%, 34rem)' },
          'onUpdate:open': (open: boolean) => {
            if (!open) emit('close')
          },
          onCloseAutoFocus: (event: Event) => {
            event.preventDefault()
            requestAnimationFrame(() => props.restoreFocus?.())
          },
        },
        {
          title: () => props.title,
          default: () =>
            h(
              'div',
              {
                class: 'flex h-full min-h-0 flex-col bg-muted/20',
                'data-click-stop-propagation': 'true',
              },
              [
                h(
                  'header',
                  {
                    class:
                      'flex flex-wrap items-start justify-between gap-3 border-b bg-background px-4 pt-5 pb-4 sm:px-6',
                  },
                  [
                    h('div', { class: 'grid min-w-0 flex-1 gap-2' }, [
                      props.back
                        ? h(
                            Button,
                            {
                              size: 'small',
                              variant: 'outline',
                              class: 'justify-self-start',
                              onClick: props.back,
                            },
                            () =>
                              props.t([
                                '← Previous field',
                                '← Champ précédent',
                                '← Campo anterior',
                              ]),
                          )
                        : null,
                      h(
                        'h2',
                        {
                          ref: heading,
                          tabindex: -1,
                          class:
                            'text-xl font-semibold tracking-tight break-words focus:outline-none',
                        },
                        props.title,
                      ),
                      h('div', { class: 'flex flex-wrap items-center gap-2' }, [
                        props.path
                          ? h(
                              'code',
                              {
                                class:
                                  'min-w-0 break-all text-xs text-muted-foreground',
                              },
                              props.path,
                            )
                          : null,
                        props.typeLabel
                          ? h(
                              'span',
                              {
                                class:
                                  'rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900',
                              },
                              props.typeLabel,
                            )
                          : null,
                      ]),
                    ]),
                    h(
                      Button,
                      {
                        size: 'small',
                        variant: 'outline',
                        onClick: () => emit('close'),
                      },
                      () => close,
                    ),
                  ],
                ),
                h(
                  Tabs,
                  {
                    class:
                      'flex min-h-0 flex-1 flex-col [&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:w-full [&_[data-slot=tabs-list]]:shrink-0 [&_[data-slot=tabs-list]]:flex-wrap [&_[data-slot=tabs-list]]:justify-start [&_[data-slot=tabs-list]]:rounded-none [&_[data-slot=tabs-list]]:border-b [&_[data-slot=tabs-list]]:bg-background [&_[data-slot=tabs-list]]:p-2 [&_[data-slot=tabs-trigger]]:flex-none [&_[data-slot=tabs-trigger]]:px-3 [&_[data-slot=tabs-trigger][data-state=active]]:bg-muted [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none [&_[data-slot=tabs-content]]:min-h-0 [&_[data-slot=tabs-content]]:overflow-y-auto [&_[data-slot=tabs-content]]:overscroll-contain',
                    tabs,
                    modelValue: active,
                    'onUpdate:modelValue': (key: SettingsSection) =>
                      emit('update:section', key),
                  },
                  {
                    default: ({ key }: { key: SettingsSection }) =>
                      h(
                        'div',
                        {
                          class:
                            'grid min-w-0 content-start gap-4 px-4 py-5 sm:px-6',
                        },
                        slots[key]?.(),
                      ),
                  },
                ),
              ],
            ),
        },
      )
    }
  },
})
