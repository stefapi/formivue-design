// @formivue-design/vue-ui — bloc form — FormCollapse / FormTab (antd-like sur
// les primitives Collapsible/Tabs, tokens shadcn).
import { computed, defineComponent, h, type PropType, type VNode } from 'vue'
import { Tabs, type ITabItem } from '../primitives/Collapsible'
import { cn } from '../lib/utils'

export const FormCollapse = defineComponent({
  name: 'DFormCollapse',
  inheritAttrs: false,
  props: {
    collapses: {
      type: Array as PropType<{ key: string; title?: string }[]>,
      default: () => [],
    },
    activeKeys: { type: Array as PropType<string[]>, default: () => [] },
    accordion: { type: Boolean, default: false },
    designerActions: { type: Object as PropType<VNode>, default: undefined },
  },
  emits: ['update:activeKeys', 'change'],
  setup(props, { attrs, slots, emit }) {
    const active = computed(() => {
      if (!props.accordion) return new Set(props.activeKeys)
      const first = props.activeKeys.find((key) =>
        props.collapses.some((panel) => panel.key === key),
      )
      return new Set(first === undefined ? [] : [first])
    })
    const toggle = (key: string) => {
      const next = new Set(active.value)
      if (next.has(key)) {
        next.delete(key)
      } else {
        if (props.accordion) next.clear()
        next.add(key)
      }
      const arr = props.collapses.map((c) => c.key).filter((k) => next.has(k))
      emit('update:activeKeys', arr)
      emit('change', arr)
    }
    return () =>
      h(
        'div',
        {
          ...attrs,
          class: cn(
            'divide-border bg-card text-card-foreground divide-y rounded-lg border',
            attrs.class as string,
          ),
        },
        [
          ...props.collapses.map((c) =>
            h('div', { key: c.key }, [
              h(
                'button',
                {
                  type: 'button',
                  class:
                    'flex w-full cursor-pointer items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/50',
                  'aria-expanded': active.value.has(c.key),
                  onClick: () => toggle(c.key),
                },
                [
                  h(
                    'span',
                    {
                      class: cn(
                        'text-muted-foreground inline-block transition-transform',
                        active.value.has(c.key) && 'rotate-90',
                      ),
                      'aria-hidden': 'true',
                    },
                    '›',
                  ),
                  slots[`${c.key}-header`]
                    ? slots[`${c.key}-header`]?.()
                    : (c.title ?? c.key),
                ],
              ),
              active.value.has(c.key)
                ? h(
                    'div',
                    { class: 'px-4 pb-4' },
                    (slots[c.key] ?? slots.default)?.({ key: c.key }),
                  )
                : null,
            ]),
          ),
          props.designerActions,
        ],
      )
  },
})

export const FormTab = defineComponent({
  name: 'DFormTab',
  inheritAttrs: false,
  props: {
    tabs: { type: Array as PropType<ITabItem[]>, default: () => [] },
    activeKey: { type: String, default: undefined },
  },
  emits: ['update:activeKey', 'change'],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        Tabs,
        {
          ...attrs,
          tabs: props.tabs,
          modelValue: props.activeKey,
          'onUpdate:modelValue': (k: string) => {
            emit('update:activeKey', k)
            emit('change', k)
          },
        },
        {
          // relais des slots par clé (Tabs expose default scoped { key })
          default: (scope: { key: string }) =>
            (slots[scope.key] ?? slots.default)?.(scope),
        },
      )
  },
})
