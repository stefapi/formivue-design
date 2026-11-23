// vue-settings-form — PositionInput (port de l'ère) : grille de positions
// (top/left/center/right/bottom). useState → ref, useEffect → watch.
// a11y (V8) : cellules <button> natives (cf. CornerInput).
import {
  defineComponent,
  h,
  ref,
  watch,
  type CSSProperties,
  type PropType,
} from 'vue'
import { usePrefix } from '@formivue-design/vue'
import cls from 'classnames'

export interface IPositionInputProps {
  className?: string
  style?: CSSProperties
  value?: string
  onChange?: (value: string) => void
}

export const PositionInput = defineComponent({
  name: 'DPositionInput',
  inheritAttrs: false,
  props: {
    value: { type: String, default: undefined },
    onChange: {
      type: null as unknown as PropType<(value: string) => void>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const prefix = usePrefix('position-input')
    const current = ref(props.value)
    watch(
      () => props.value,
      () => {
        if (!props.value) {
          current.value = 'center'
        }
      },
      { immediate: true },
    )
    const cell = (type: string, glyph: string) =>
      h(
        'button',
        {
          type: 'button',
          key: type,
          class: cls(
            prefix + '-cell',
            'flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm border border-border text-xs text-foreground',
            {
              'bg-primary text-primary-foreground': current.value === type,
            },
          ),
          'aria-pressed': current.value === type ? 'true' : 'false',
          'aria-label': type,
          onClick: () => {
            current.value = type
            props.onChange?.(type)
          },
        },
        glyph,
      )
    return () =>
      h(
        'div',
        {
          class: cls(
            prefix,
            'flex w-fit flex-col items-center gap-1',
            attrs.class as string,
          ),
          style: attrs.style as any,
        },
        [
          h('div', { class: cls(prefix + '-row', 'flex gap-1') }, [
            cell('top', '┳'),
          ]),
          h('div', { class: cls(prefix + '-row', 'flex gap-1') }, [
            cell('left', '┣'),
            cell('center', '╋'),
            cell('right', '┫'),
          ]),
          h('div', { class: cls(prefix + '-row', 'flex gap-1') }, [
            cell('bottom', '┻'),
          ]),
        ],
      )
  },
})
