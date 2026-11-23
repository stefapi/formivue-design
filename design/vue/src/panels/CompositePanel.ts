import {
  computed,
  defineComponent,
  h,
  isVNode,
  ref,
  watch,
  type PropType,
} from 'vue'
import { isValid } from '@formivue-design/shared'
import cls from 'classnames'
import { IconWidget, TextWidget } from '../widgets'
import { usePrefix } from '../hooks'

export interface ICompositePanelProps {
  direction?: 'left' | 'right'
  showNavTitle?: boolean
  defaultOpen?: boolean
  defaultPinning?: boolean
  defaultActiveKey?: number
  activeKey?: number | string
  onChange?: (activeKey: number | string) => void
}
export interface ICompositePanelItemProps {
  shape?: 'tab' | 'button' | 'link'
  title?: any
  icon?: any
  key?: number | string
  href?: string
  onClick?: (e: MouseEvent) => void
  extra?: any
}

// Era : CompositePanel.Item = fragment déclaratif (les items sont parsés depuis
// les children). Vue : les vnodes du slot sont parsés de la même façon — le
// Item ne rend rien.
const CompositePanelItem = defineComponent({
  name: 'CompositePanel.Item',
  setup() {
    return () => null
  },
})

const parseItems = (children: any[]) => {
  const items: (ICompositePanelItemProps & {
    key: number | string
    content?: () => any
  })[] = []
  ;(children || []).forEach((child, index) => {
    if (!isVNode(child)) return
    if ((child.type as any) === CompositePanelItem) {
      const itemChildren = child.children as any
      items.push({
        key: (child.key as any) ?? index,
        ...(child.props as any),
        content: isFnChild(itemChildren)
          ? itemChildren
          : itemChildren?.default
            ? itemChildren.default
            : () => [],
      })
    }
  })
  return items
}

const isFnChild = (children: any): children is () => any =>
  typeof children === 'function'

export const CompositePanel = defineComponent({
  name: 'CompositePanel',
  props: {
    direction: {
      type: String as PropType<'left' | 'right'>,
      default: 'left',
    },
    showNavTitle: { type: Boolean, default: false },
    defaultOpen: { type: Boolean, default: true },
    defaultPinning: { type: Boolean, default: false },
    defaultActiveKey: { type: [Number, String], default: undefined },
    activeKey: { type: [Number, String], default: undefined },
    onChange: {
      type: Function as PropType<(activeKey: number | string) => void>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const prefix = usePrefix('composite-panel')
    const activeKey = ref<string | number | null>(
      props.defaultActiveKey ?? null,
    )
    const pinning = ref(props.defaultPinning ?? false)
    const visible = ref(props.defaultOpen ?? true)

    watch(
      () => props.activeKey,
      () => {
        if (isValid(props.activeKey)) {
          if (props.activeKey !== activeKey.value) {
            activeKey.value = props.activeKey
          }
        }
      },
    )

    const items = computed(() => parseItems(slots.default?.() as any))
    // clé effective : la clé d'ère par défaut (premier item) est résolue au
    // render — un slot ne peut pas être invoqué au setup sans perdre le
    // tracking (warning Vue)
    const currentActiveKey = computed(() => {
      if (activeKey.value == null) {
        return items.value[0]?.key ?? 0
      }
      return activeKey.value
    })
    const currentItem = computed(() =>
      items.value.find(
        (item, index) =>
          currentActiveKey.value === index ||
          currentActiveKey.value === item.key,
      ),
    )

    const renderContent = () => {
      const content = currentItem.value?.content?.()
      if (
        !content ||
        (Array.isArray(content) && !content.length) ||
        !visible.value
      )
        return
      // Structure d'ère (panels/styles.less) en utilitaires (V6) : contenu
      // 300px colonne flex ; pinning → absolute collé à la barre d'onglets.
      return h(
        'div',
        {
          class: cls(
            prefix + '-tabs-content',
            'box-content flex h-full w-[300px] flex-col border-border bg-card',
            props.direction === 'right' ? 'border-l' : 'border-r',
            {
              pinning: pinning.value,
              'absolute left-full top-0 z-[1] border-r-transparent shadow-[-2px_5px_10px_rgba(102,102,102,0.42)]':
                pinning.value && props.direction === 'left',
              'absolute right-full top-0 z-[1] border-l-transparent shadow-[2px_5px_10px_rgba(102,102,102,0.42)]':
                pinning.value && props.direction === 'right',
            },
          ),
          role: 'tabpanel',
        },
        [
          h(
            'div',
            {
              class: cls(
                prefix + '-tabs-header',
                'flex justify-between border-b border-border px-1.75 py-3.5 text-base leading-[18px] text-muted-foreground',
              ),
            },
            [
              h('div', { class: prefix + '-tabs-header-title text-xl' }, [
                h(TextWidget, { token: currentItem.value?.title }),
              ]),
              h(
                'div',
                {
                  class:
                    prefix + '-tabs-header-actions flex items-center gap-2',
                },
                [
                  h('div', { class: prefix + '-tabs-header-extra' }, [
                    currentItem.value?.extra,
                  ]),
                  !pinning.value &&
                    h(IconWidget, {
                      infer: 'PushPinOutlined',
                      class:
                        prefix +
                        '-tabs-header-pin transition-transform duration-150 hover:scale-110',
                      onClick: () => {
                        pinning.value = !pinning.value
                      },
                    }),
                  pinning.value &&
                    h(IconWidget, {
                      infer: 'PushPinFilled',
                      class:
                        prefix +
                        '-tabs-header-pin-filled transition-transform duration-150 hover:scale-110',
                      onClick: () => {
                        pinning.value = !pinning.value
                      },
                    }),
                  h(IconWidget, {
                    infer: 'Close',
                    class:
                      prefix +
                      '-tabs-header-close transition-transform duration-150 hover:rotate-90',
                    onClick: () => {
                      visible.value = false
                    },
                  }),
                ],
              ),
            ],
          ),
          h(
            'div',
            {
              // a11y (V8/axe scrollable-region-focusable) : région
              // scrollable accessible au clavier
              tabindex: '0',
              class: cls(
                prefix + '-tabs-body',
                'h-full grow-[2] shrink-[2] overflow-x-hidden overflow-y-auto',
              ),
            },
            [content],
          ),
        ],
      )
    }

    return () =>
      h(
        'div',
        {
          // structure d'ère : flex, shrink-0, relative, z-2 ; direction-right
          // → row-reverse (le contenu et les bordures basculent)
          class: cls(
            prefix,
            'flex shrink-0 grow-0 relative z-[2] select-none',
            props.direction === 'right' && 'flex-row-reverse',
            {
              [`direction-${props.direction}`]: !!props.direction,
            },
          ),
        },
        [
          h(
            'div',
            {
              class: cls(
                prefix + '-tabs',
                'flex flex-col bg-card relative z-[2]',
                props.direction === 'right'
                  ? 'border-l border-border'
                  : 'border-r border-border',
              ),
              role: 'tablist',
            },
            items.value.map((item, index) => {
              const takeTab = () => {
                if (item.href) {
                  return h('a', { href: item.href }, [item.icon])
                }
                return h(IconWidget, {
                  tooltip: props.showNavTitle
                    ? null
                    : {
                        title: h(TextWidget, { token: item.title }),
                        placement:
                          props.direction === 'right' ? 'left' : 'right',
                      },
                  infer: item.icon,
                })
              }
              const shape = item.shape ?? 'tab'
              const Comp = shape === 'link' ? 'a' : 'div'
              return h(
                Comp as any,
                {
                  // structure d'ère du pane : 48×48, colonne centrée,
                  // curseur pointer ; actif → barre 3px à gauche de la barre
                  // d'onglets (right: à droite) ; la couleur est
                  // strictement conditionnelle (deux utilitaires couleur
                  // ensemble = l'ordre CSS déciderait, pas l'état)
                  class: cls(
                    prefix + '-tabs-pane',
                    'flex min-h-12 min-w-12 cursor-pointer select-none flex-col items-center justify-center p-2.5 relative text-xl',
                    currentActiveKey.value === item.key
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-primary',
                    currentActiveKey.value === item.key &&
                      (props.direction === 'right'
                        ? "after:absolute after:right-0 after:top-0 after:block after:h-full after:w-[3px] after:bg-primary after:content-['']"
                        : "after:absolute after:left-0 after:top-0 after:block after:h-full after:w-[3px] after:bg-primary after:content-['']"),
                    {
                      active: currentActiveKey.value === item.key,
                    },
                  ),
                  key: index,
                  href: item.href,
                  role: shape === 'tab' ? 'tab' : undefined,
                  'aria-selected':
                    shape === 'tab'
                      ? currentActiveKey.value === item.key
                      : undefined,
                  onClick: (e: any) => {
                    if (shape === 'tab') {
                      if (currentActiveKey.value === item.key) {
                        visible.value = !visible.value
                      } else {
                        visible.value = true
                      }
                      if (!props?.activeKey || !props?.onChange)
                        activeKey.value = item.key
                    }
                    item.onClick?.(e)
                    props.onChange?.(item.key)
                  },
                },
                [
                  takeTab(),
                  // a11y (V8/axe aria-tab-name) : le pane icône seule n'est
                  // pas nommé — le title devient un nom accessible masqué
                  // (sr-only) quand il n'est pas affiché sous l'icône
                  props.showNavTitle && item.title
                    ? h(
                        'div',
                        {
                          class:
                            prefix +
                            '-tabs-pane-title mt-1.5 text-[10px] leading-none',
                        },
                        [h(TextWidget, { token: item.title })],
                      )
                    : item.title
                      ? h('span', { class: 'sr-only' }, [
                          h(TextWidget, { token: item.title }),
                        ])
                      : null,
                ],
              )
            }),
          ),
          renderContent(),
        ],
      )
  },
}) as any

CompositePanel.Item = CompositePanelItem
