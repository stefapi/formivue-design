import {
  computed,
  defineComponent,
  h,
  ref,
  Teleport,
  watchPostEffect,
  type PropType,
} from 'vue'
import { Button } from '@formivue-design/vue-ui'
import { GripVerticalIcon, XIcon } from '@lucide/vue'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerOverlay,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
  SplitterGroup,
  SplitterPanel,
  SplitterResizeHandle,
} from 'reka-ui'
import { sectionsProp, useSections } from './sections'
import { AdvancedOverlayTarget, useAdvancedOverlayTarget } from './overlay'

export const ScrollArea = defineComponent({
  name: 'ScrollArea',
  inheritAttrs: false,
  props: {
    height: { type: Number, default: 240 },
    label: { type: String, default: 'Scrollable content' },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        ScrollAreaRoot,
        {
          ...attrs,
          class: [
            'relative min-w-0 overflow-hidden rounded-md border',
            attrs.class,
          ],
          style: [
            { height: `${Math.max(40, props.height || 240)}px` },
            attrs.style,
          ],
        },
        () => [
          h(
            ScrollAreaViewport,
            {
              tabindex: 0,
              role: 'region',
              'aria-label': props.label,
              class:
                'size-full rounded-[inherit] p-3 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
            },
            slots,
          ),
          h(
            ScrollAreaScrollbar,
            { orientation: 'vertical', class: 'flex w-2.5 touch-none p-px' },
            () =>
              h(ScrollAreaThumb, {
                class: 'relative flex-1 rounded-full bg-border',
              }),
          ),
        ],
      )
  },
})

export const Carousel = defineComponent({
  name: 'Carousel',
  inheritAttrs: false,
  props: {
    sections: sectionsProp,
    loop: Boolean,
    label: { type: String, default: 'Carousel' },
    previousText: { type: String, default: 'Previous slide' },
    nextText: { type: String, default: 'Next slide' },
  },
  setup(props, { attrs, slots }) {
    const sections = useSections('CarouselSlide', props, slots)
    const viewport = ref<HTMLElement>()
    const active = ref(0)
    const viewportHeight = ref<number>()
    watchPostEffect((onCleanup) => {
      const element = viewport.value
      const index = Math.min(active.value, sections.value.length - 1)
      const slide = element?.children[index]
      if (!element || !(slide instanceof HTMLElement)) {
        viewportHeight.value = undefined
        return
      }
      const updateHeight = () => {
        const chromeHeight = element.offsetHeight - element.clientHeight
        viewportHeight.value =
          Math.ceil(slide.getBoundingClientRect().height) + chromeHeight
      }
      updateHeight()
      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(updateHeight)
        observer.observe(slide)
        onCleanup(() => observer.disconnect())
      }
    })
    const move = (direction: number) => {
      const count = sections.value.length
      if (!count) return
      const current = Math.min(active.value, count - 1)
      const requested = current + direction
      const index = props.loop
        ? (requested + count) % count
        : Math.max(0, Math.min(count - 1, requested))
      const element = viewport.value?.children[index]
      if (element instanceof HTMLElement && viewport.value) {
        viewport.value.scrollLeft +=
          element.getBoundingClientRect().left -
          (viewport.value.getBoundingClientRect().left +
            viewport.value.clientLeft)
      }
      active.value = index
    }
    const onScroll = () => {
      if (!viewport.value) return
      const left =
        viewport.value.getBoundingClientRect().left + viewport.value.clientLeft
      let closest = Infinity
      for (const [index, element] of Array.from(
        viewport.value.children,
      ).entries()) {
        const distance = Math.abs(element.getBoundingClientRect().left - left)
        if (distance < closest) {
          closest = distance
          active.value = index
        }
      }
    }
    return () =>
      h(
        'section',
        {
          ...attrs,
          'aria-label': props.label,
          'aria-roledescription': 'carousel',
          class: [
            'relative grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2',
            attrs.class,
          ],
        },
        [
          h(
            'div',
            {
              ref: viewport,
              tabindex: 0,
              role: 'group',
              'aria-label': props.label,
              class:
                'flex min-w-0 snap-x snap-mandatory items-start overflow-x-auto overflow-y-hidden rounded-md border focus-visible:ring-2 focus-visible:ring-ring',
              style: {
                height:
                  viewportHeight.value == null
                    ? undefined
                    : `${viewportHeight.value}px`,
              },
              onScroll,
              onKeydown: (event: KeyboardEvent) => {
                if (
                  event.target !== event.currentTarget ||
                  !['ArrowLeft', 'ArrowRight'].includes(event.key)
                )
                  return
                event.preventDefault()
                move(event.key === 'ArrowRight' ? 1 : -1)
              },
            },
            sections.value.map((section, index) =>
              h(
                'div',
                {
                  key: section.id,
                  role: 'group',
                  'aria-roledescription': 'slide',
                  'aria-label':
                    section.title || `${index + 1} / ${sections.value.length}`,
                  class:
                    'w-full min-w-0 shrink-0 snap-start overflow-hidden p-4',
                },
                [section.render()],
              ),
            ),
          ),
          sections.value.length > 1
            ? h(
                'div',
                { class: 'flex flex-wrap items-center justify-end gap-2' },
                [
                  h(
                    Button,
                    {
                      size: 'small',
                      disabled: !props.loop && active.value === 0,
                      onClick: () => move(-1),
                    },
                    () => props.previousText,
                  ),
                  h(
                    Button,
                    {
                      size: 'small',
                      disabled:
                        !props.loop &&
                        active.value >= sections.value.length - 1,
                      onClick: () => move(1),
                    },
                    () => props.nextText,
                  ),
                ],
              )
            : null,
        ],
      )
  },
})

export const Resizable = defineComponent({
  name: 'Resizable',
  inheritAttrs: false,
  props: {
    sections: sectionsProp,
    direction: {
      type: String as PropType<'horizontal' | 'vertical'>,
      default: 'horizontal',
    },
    height: Number,
    handleLabel: { type: String, default: 'Resize panels' },
  },
  setup(props, { attrs, slots }) {
    const sections = useSections('ResizablePanel', props, slots, false)
    return () => {
      const vertical = props.direction === 'vertical'
      const height = props.height ?? (vertical ? 320 : undefined)
      return h(
        SplitterGroup,
        {
          ...attrs,
          direction: props.direction,
          class: [
            'w-full min-w-0 rounded-md border',
            height == null && 'min-h-24',
            attrs.class,
          ],
          style: [
            height != null
              ? { height: `${Math.max(40, height)}px` }
              : undefined,
            attrs.style,
          ],
        },
        () =>
          sections.value.flatMap((section, index) => [
            ...(index === 0
              ? []
              : [
                  h(
                    SplitterResizeHandle,
                    {
                      key: `handle-${section.id}`,
                      'aria-label': props.handleLabel,
                      class: [
                        'relative flex shrink-0 items-center justify-center bg-border focus-visible:ring-2 focus-visible:ring-ring',
                        vertical ? 'h-2 w-full' : 'h-auto w-2',
                      ],
                    },
                    () =>
                      h(GripVerticalIcon, {
                        'aria-hidden': true,
                        class: [
                          'size-3 text-muted-foreground',
                          vertical && 'rotate-90',
                        ],
                      }),
                  ),
                ]),
            h(
              SplitterPanel,
              {
                key: section.id,
                order: index,
                defaultSize: section.defaultSize,
                minSize: section.minSize,
                maxSize: section.maxSize,
              },
              () =>
                h('div', { class: 'size-full min-w-0 overflow-auto p-3' }, [
                  section.title
                    ? h(
                        'h3',
                        { class: 'mb-2 text-sm font-medium wrap-anywhere' },
                        section.title,
                      )
                    : null,
                  section.render(),
                ]),
            ),
          ]),
      )
    }
  },
})

const panelProps = {
  title: String,
  description: String,
  triggerText: { type: String, default: 'Open' },
  closeText: { type: String, default: 'Close' },
  defaultOpen: Boolean,
  open: { type: Boolean, default: undefined },
}
function usePanelContent(
  props: { open?: boolean; defaultOpen: boolean },
  update: (value: boolean) => void,
) {
  const openLocally = ref(props.defaultOpen)
  const open = computed(() => props.open ?? openLocally.value)
  const destination = ref<HTMLElement>()
  const bindings = () => ({
    open: open.value,
    'onUpdate:open': (value: boolean) => {
      openLocally.value = value
      update(value)
    },
  })
  return { destination, open, bindings }
}

const overlayClass = 'pointer-events-auto inset-0 z-50 bg-black/50'
const panelClass =
  'pointer-events-auto flex flex-col gap-4 overflow-auto border bg-background p-6 text-foreground shadow-lg'
const closeClass =
  'absolute top-3 right-3 rounded-sm p-1 text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring'
const sheetSides = {
  right: 'inset-y-0 right-0 h-full w-full max-w-sm border-l',
  left: 'inset-y-0 left-0 h-full w-full max-w-sm border-r',
}

export const Sheet = defineComponent({
  name: 'Sheet',
  inheritAttrs: false,
  props: {
    ...panelProps,
    side: {
      type: String as PropType<keyof typeof sheetSides>,
      default: 'right',
    },
  },
  emits: ['update:open'],
  setup(props, { attrs, slots, emit }) {
    const panel = usePanelContent(props, (value) => emit('update:open', value))
    const target = useAdvancedOverlayTarget()
    const position = () => (target?.value ? 'absolute' : 'fixed')
    return () =>
      h('div', attrs, [
        h(DialogRoot, panel.bindings(), () => [
          h(
            DialogTrigger,
            { asChild: true },
            () => slots.trigger?.() ?? h(Button, {}, () => props.triggerText),
          ),
          h(DialogPortal, { to: target?.value }, () => [
            h(DialogOverlay, { class: [position(), overlayClass] }),
            h(
              DialogContent,
              {
                class: [position(), 'z-50', panelClass, sheetSides[props.side]],
                'aria-describedby': props.description ? undefined : null,
              },
              () => [
                h(
                  DialogTitle,
                  { class: 'pr-6 text-lg font-semibold wrap-anywhere' },
                  () => props.title || props.triggerText,
                ),
                props.description
                  ? h(
                      DialogDescription,
                      {
                        class:
                          'text-sm whitespace-pre-wrap wrap-anywhere text-muted-foreground',
                      },
                      () => props.description,
                    )
                  : null,
                h(
                  DialogClose,
                  { 'aria-label': props.closeText, class: closeClass },
                  () => h(XIcon, { class: 'size-4', 'aria-hidden': true }),
                ),
                h('div', { ref: panel.destination }),
              ],
            ),
          ]),
        ]),
        h('div', { hidden: true }, [
          h(
            Teleport,
            {
              to: panel.destination.value,
              disabled: !panel.open.value || !panel.destination.value,
            },
            [
              h(
                AdvancedOverlayTarget,
                { target: panel.destination.value },
                { default: slots.default },
              ),
            ],
          ),
        ]),
      ])
  },
})

export const Drawer = defineComponent({
  name: 'Drawer',
  inheritAttrs: false,
  props: panelProps,
  emits: ['update:open'],
  setup(props, { attrs, slots, emit }) {
    const panel = usePanelContent(props, (value) => emit('update:open', value))
    const target = useAdvancedOverlayTarget()
    const position = () => (target?.value ? 'absolute' : 'fixed')
    return () =>
      h('div', attrs, [
        h(DrawerRoot, panel.bindings(), () => [
          h(
            DrawerTrigger,
            { asChild: true },
            () => slots.trigger?.() ?? h(Button, {}, () => props.triggerText),
          ),
          h(DrawerPortal, { to: target?.value }, () => [
            h(DrawerOverlay, { class: [position(), overlayClass] }),
            h(
              DrawerViewport,
              {
                class: [
                  position(),
                  'pointer-events-none inset-0 z-50 flex items-end justify-center',
                ],
              },
              () =>
                h(
                  DrawerContent,
                  {
                    class: [
                      panelClass,
                      'relative w-full max-w-3xl rounded-t-lg pb-8 [transform:translateY(var(--drawer-swipe-movement-y,0px))]',
                      target?.value ? 'max-h-[85%]' : 'max-h-[85dvh]',
                    ],
                    'aria-describedby': props.description ? undefined : null,
                  },
                  () => [
                    h(DrawerHandle, {
                      class:
                        'mx-auto h-1.5 w-12 shrink-0 rounded-full bg-muted',
                    }),
                    h(
                      DrawerTitle,
                      { class: 'pr-6 text-lg font-semibold wrap-anywhere' },
                      () => props.title || props.triggerText,
                    ),
                    props.description
                      ? h(
                          DrawerDescription,
                          {
                            class:
                              'text-sm whitespace-pre-wrap wrap-anywhere text-muted-foreground',
                          },
                          () => props.description,
                        )
                      : null,
                    h(
                      DrawerClose,
                      { 'aria-label': props.closeText, class: closeClass },
                      () => h(XIcon, { class: 'size-4', 'aria-hidden': true }),
                    ),
                    h('div', { ref: panel.destination }),
                  ],
                ),
            ),
          ]),
        ]),
        h('div', { hidden: true }, [
          h(
            Teleport,
            {
              to: panel.destination.value,
              disabled: !panel.open.value || !panel.destination.value,
            },
            [
              h(
                AdvancedOverlayTarget,
                { target: panel.destination.value },
                { default: slots.default },
              ),
            ],
          ),
        ]),
      ])
  },
})
