import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  type PropType,
} from 'vue'
import { Button } from '@formivue-design/vue-ui'
import {
  AvatarFallback,
  AvatarImage,
  AvatarRoot,
  HoverCardContent,
  HoverCardPortal,
  HoverCardRoot,
  HoverCardTrigger,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui'
import { useAdvancedOverlayTarget } from './overlay'

export const Badge = defineComponent({
  name: 'Badge',
  props: {
    text: String,
    variant: {
      type: String as PropType<
        'default' | 'secondary' | 'outline' | 'destructive'
      >,
      default: 'default',
    },
  },
  setup(props, { slots }) {
    const variants = {
      default: 'border-transparent bg-primary text-primary-foreground',
      secondary: 'border-transparent bg-secondary text-secondary-foreground',
      outline: 'text-foreground',
      destructive: 'border-transparent bg-destructive text-white',
    }
    return () => {
      const content = slots.default?.()
      return h(
        'span',
        {
          class: [
            'inline-flex w-fit min-w-0 max-w-full items-center rounded-full border px-2 py-0.5 text-xs font-medium wrap-anywhere',
            variants[props.variant],
          ],
        },
        content?.length ? content : props.text,
      )
    }
  },
})

export const Avatar = defineComponent({
  name: 'Avatar',
  props: {
    src: String,
    alt: String,
    fallback: { type: String, default: '' },
    size: { type: Number, default: 40 },
  },
  setup(props) {
    return () =>
      h(
        AvatarRoot,
        {
          role: props.alt ? 'img' : undefined,
          'aria-label': props.alt,
          class:
            'relative inline-flex shrink-0 overflow-hidden rounded-full align-middle',
          style: {
            width: Math.max(1, props.size) + 'px',
            height: Math.max(1, props.size) + 'px',
          },
        },
        () => [
          props.src
            ? h(AvatarImage, {
                key: props.src,
                src: props.src,
                alt: '',
                class: 'aspect-square size-full object-cover',
              })
            : null,
          h(
            AvatarFallback,
            {
              class:
                'flex size-full items-center justify-center bg-muted text-sm font-medium',
              'aria-hidden': true,
            },
            () => props.fallback,
          ),
        ],
      )
  },
})

export const HoverCard = defineComponent({
  name: 'HoverCard',
  inheritAttrs: false,
  props: {
    triggerText: { type: String, default: 'More information' },
    href: String,
    title: String,
    message: String,
  },
  setup(props, { attrs, slots }) {
    const overlayTarget = useAdvancedOverlayTarget()
    const touch = ref(false)
    let pointer: MediaQueryList | undefined
    const updatePointer = () => {
      touch.value = pointer?.matches ?? false
    }
    onMounted(() => {
      pointer = window.matchMedia('(pointer: coarse)')
      updatePointer()
      pointer.addEventListener('change', updatePointer)
    })
    onBeforeUnmount(() => pointer?.removeEventListener('change', updatePointer))
    const href = computed(() => {
      if (!props.href) return undefined
      try {
        const url = new URL(props.href, 'https://formivue.invalid')
        return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol)
          ? props.href
          : undefined
      } catch {
        return undefined
      }
    })
    const triggerClass =
      'rounded-sm text-sm font-medium underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring'
    const contentClass =
      'pointer-events-auto z-50 w-64 max-w-[min(calc(100vw-2rem),var(--reka-popper-available-width,100vw))] space-y-1 rounded-md border bg-popover p-4 text-sm text-popover-foreground shadow-md'
    const content = () => [
      props.title ? h('p', { class: 'font-medium' }, props.title) : null,
      props.message
        ? h(
            'p',
            {
              class: 'whitespace-pre-wrap wrap-anywhere text-muted-foreground',
            },
            props.message,
          )
        : null,
      slots.default?.(),
    ]
    return () =>
      h('div', attrs, [
        touch.value && href.value && !slots.trigger
          ? h(PopoverRoot, null, () => [
              h(
                PopoverTrigger,
                { class: triggerClass },
                () => props.triggerText,
              ),
              h(PopoverPortal, { to: overlayTarget?.value }, () =>
                h(
                  PopoverContent,
                  {
                    sideOffset: 8,
                    align: 'start',
                    'aria-label': props.title || props.triggerText,
                    class: contentClass,
                  },
                  () => [
                    ...content(),
                    h(
                      'a',
                      { href: href.value, class: triggerClass },
                      props.triggerText,
                    ),
                  ],
                ),
              ),
            ])
          : h(
              HoverCardRoot,
              { openDelay: 150, closeDelay: 150, enableTouch: !href.value },
              () => [
                h(
                  HoverCardTrigger,
                  { asChild: true },
                  () =>
                    slots.trigger?.() ??
                    h(
                      href.value ? 'a' : 'button',
                      {
                        href: href.value,
                        type: href.value ? undefined : 'button',
                        class: triggerClass,
                      },
                      props.triggerText,
                    ),
                ),
                h(HoverCardPortal, { to: overlayTarget?.value }, () =>
                  h(
                    HoverCardContent,
                    {
                      sideOffset: 8,
                      align: 'start',
                      class: contentClass,
                    },
                    content,
                  ),
                ),
              ],
            ),
      ])
  },
})

export type DataTableRow = Record<string, string | number | boolean | null>
export interface DataTableColumn {
  key: string
  title: string
  sortable?: boolean
}

export const DataTable = defineComponent({
  name: 'DataTable',
  props: {
    columns: { type: Array as PropType<DataTableColumn[]>, default: () => [] },
    rows: { type: Array as PropType<DataTableRow[]>, default: () => [] },
    rowKey: { type: String, default: 'id' },
    pageSize: { type: Number, default: 10 },
    searchable: { type: Boolean, default: true },
    searchLabel: { type: String, default: 'Search table' },
    emptyText: { type: String, default: 'No results' },
    previousText: { type: String, default: 'Previous' },
    nextText: { type: String, default: 'Next' },
    label: { type: String, default: 'Data table' },
  },
  setup(props) {
    const query = ref('')
    const sort = ref<{ key: string; ascending: boolean }>()
    const page = ref(1)
    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: 'base',
    })
    const display = (value: DataTableRow[string]) => String(value ?? '')
    const filtered = computed(() => {
      const term = props.searchable
        ? query.value.trim().toLocaleLowerCase()
        : ''
      const rows = props.rows
        .map((row, index) => ({ row, index }))
        .filter(
          ({ row }) =>
            !term ||
            props.columns.some(({ key }) =>
              display(row[key]).toLocaleLowerCase().includes(term),
            ),
        )
      const column = sort.value
      if (
        !column ||
        !props.columns.some(
          ({ key, sortable }) => key === column.key && sortable !== false,
        )
      )
        return rows
      return rows.sort((a, b) => {
        const first = a.row[column.key]
        const second = b.row[column.key]
        const order =
          typeof first === 'number' && typeof second === 'number'
            ? first - second
            : collator.compare(display(first), display(second))
        return column.ascending ? order : -order
      })
    })
    const size = computed(() => Math.max(1, Math.trunc(props.pageSize) || 10))
    const pages = computed(() =>
      Math.max(1, Math.ceil(filtered.value.length / size.value)),
    )
    const current = computed(() => Math.min(page.value, pages.value))
    return () =>
      h(
        'div',
        { class: 'grid min-w-0 max-w-full grid-cols-[minmax(0,1fr)] gap-3' },
        [
          props.searchable
            ? h('input', {
                type: 'search',
                'aria-label': props.searchLabel,
                placeholder: props.searchLabel,
                value: query.value,
                class:
                  'h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring',
                onInput: (event: Event) => {
                  query.value = (event.target as HTMLInputElement).value
                  page.value = 1
                },
              })
            : null,
          h(
            'div',
            {
              tabindex: 0,
              role: 'region',
              'aria-label': props.label,
              class:
                'min-w-0 overflow-x-auto rounded-md border focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
            },
            [
              h(
                'table',
                { class: 'w-full text-sm', 'aria-label': props.label },
                [
                  h('thead', { class: 'border-b bg-muted/50' }, [
                    h(
                      'tr',
                      props.columns.map((column) => {
                        const active = column.key === sort.value?.key
                        const direction = active
                          ? sort.value.ascending
                            ? 'ascending'
                            : 'descending'
                          : undefined
                        return h(
                          'th',
                          {
                            key: column.key,
                            scope: 'col',
                            'aria-sort': direction,
                            class:
                              'min-w-28 px-3 py-2 text-left font-medium wrap-anywhere',
                          },
                          column.sortable === false
                            ? column.title
                            : h(
                                'button',
                                {
                                  type: 'button',
                                  class:
                                    'inline-flex items-center gap-1 rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring',
                                  onClick: () => {
                                    sort.value = {
                                      key: column.key,
                                      ascending:
                                        !active || !sort.value.ascending,
                                    }
                                    page.value = 1
                                  },
                                },
                                [
                                  column.title,
                                  h(
                                    'span',
                                    { 'aria-hidden': true },
                                    direction === 'ascending'
                                      ? '↑'
                                      : direction === 'descending'
                                        ? '↓'
                                        : '↕',
                                  ),
                                ],
                              ),
                        )
                      }),
                    ),
                  ]),
                  h(
                    'tbody',
                    filtered.value.length && props.columns.length
                      ? filtered.value
                          .slice(
                            (current.value - 1) * size.value,
                            current.value * size.value,
                          )
                          .map(({ row, index }) =>
                            h(
                              'tr',
                              {
                                key:
                                  row[props.rowKey] == null
                                    ? index
                                    : String(row[props.rowKey]),
                                class:
                                  'border-b last:border-0 hover:bg-muted/50',
                              },
                              props.columns.map(({ key }) =>
                                h(
                                  'td',
                                  {
                                    key,
                                    class: 'max-w-72 px-3 py-2 wrap-anywhere',
                                  },
                                  display(row[key]),
                                ),
                              ),
                            ),
                          )
                      : [
                          h('tr', [
                            h(
                              'td',
                              {
                                colspan: Math.max(1, props.columns.length),
                                class: 'p-4 text-center text-muted-foreground',
                              },
                              props.emptyText,
                            ),
                          ]),
                        ],
                  ),
                ],
              ),
            ],
          ),
          pages.value > 1
            ? h(
                'div',
                { class: 'flex flex-wrap items-center justify-end gap-2' },
                [
                  h(
                    'span',
                    { class: 'text-sm text-muted-foreground', role: 'status' },
                    `${current.value} / ${pages.value}`,
                  ),
                  h(
                    Button,
                    {
                      size: 'small',
                      disabled: current.value === 1,
                      onClick: () => {
                        page.value = current.value - 1
                      },
                    },
                    () => props.previousText,
                  ),
                  h(
                    Button,
                    {
                      size: 'small',
                      disabled: current.value === pages.value,
                      onClick: () => {
                        page.value = current.value + 1
                      },
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
