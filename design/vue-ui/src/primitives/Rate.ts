// @formivue-design/vue-ui — primitives — Rate (maison, V3 backlog levé) : note en
// étoiles, demi-étoile optionnelle, effacement au re-clic (allowClear),
// infobulles par étoile. a11y : role=slider (aria-valuenow/min/max/text) +
// clavier ←/→/↑/↓, Home/End, Delete/Backspace pour effacer.
import { defineComponent, h, ref, type PropType } from 'vue'
import { cn } from '../lib/utils'

const STAR_PATH =
  'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z'

const star = (className: string) =>
  h(
    'svg',
    {
      viewBox: '0 0 24 24',
      class: className,
      fill: 'currentColor',
      'aria-hidden': 'true',
    },
    [h('path', { d: STAR_PATH })],
  )

export const Rate = defineComponent({
  name: 'DRate',
  inheritAttrs: false,
  props: {
    value: { type: Number, default: undefined },
    onChange: {
      type: Function as PropType<(value: number) => void>,
      default: undefined,
    },
    count: { type: Number, default: 5 },
    allowHalf: { type: Boolean, default: false },
    allowClear: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
    tooltips: { type: Array as PropType<string[]>, default: undefined },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit }) {
    const hover = ref<number | null>(null)
    const interactive = () => !props.disabled && !props.readOnly
    const step = () => (props.allowHalf ? 0.5 : 1)
    const commit = (next: number) => {
      if (!interactive()) return
      const value = Math.min(props.count, Math.max(0, next))
      const resolved =
        props.allowClear && value === (props.value ?? 0) ? 0 : value
      emit('update:value', resolved)
      props.onChange?.(resolved)
    }
    const valueAt = (index: number, e: MouseEvent) => {
      if (!props.allowHalf) return index + 1
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      return e.clientX - rect.left < rect.width / 2 ? index + 0.5 : index + 1
    }
    const onKeydown = (e: KeyboardEvent) => {
      if (!interactive()) return
      const current = props.value ?? 0
      const moves: Record<string, number> = {
        ArrowRight: current + step(),
        ArrowUp: current + step(),
        ArrowLeft: current - step(),
        ArrowDown: current - step(),
        Home: 0,
        End: props.count,
        Delete: 0,
        Backspace: 0,
      }
      if (!(e.key in moves)) return
      e.preventDefault()
      const next = Math.min(props.count, Math.max(0, moves[e.key]))
      emit('update:value', next)
      props.onChange?.(next)
    }
    return () => {
      const shown = hover.value ?? props.value ?? 0
      return h(
        'div',
        {
          ...attrs,
          'data-slot': 'rate',
          role: 'slider',
          tabindex: interactive() ? 0 : -1,
          'aria-valuemin': 0,
          'aria-valuemax': props.count,
          'aria-valuenow': props.value ?? 0,
          'aria-valuetext': `${props.value ?? 0} / ${props.count}`,
          'aria-disabled': props.disabled || undefined,
          'aria-readonly': props.readOnly || undefined,
          class: cn(
            'inline-flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            props.disabled && 'cursor-not-allowed opacity-50',
            attrs.class as string,
          ),
          onKeydown,
          onMouseleave: () => (hover.value = null),
        },
        Array.from({ length: props.count }, (_, index) => {
          const fill = Math.min(1, Math.max(0, shown - index))
          return h(
            'span',
            {
              key: index,
              title: props.tooltips?.[index],
              class: cn(
                'relative inline-flex size-5 transition-transform',
                interactive() && 'cursor-pointer hover:scale-110',
              ),
              onMousemove: (e: MouseEvent) => {
                if (interactive()) hover.value = valueAt(index, e)
              },
              onClick: (e: MouseEvent) => commit(valueAt(index, e)),
            },
            [
              star('size-5 text-foreground/15'),
              fill > 0
                ? h(
                    'span',
                    {
                      class: 'absolute inset-y-0 left-0 overflow-hidden',
                      style: { width: `${fill * 100}%` },
                    },
                    [star('size-5 text-amber-400')],
                  )
                : null,
            ],
          )
        }),
      )
    }
  },
})
