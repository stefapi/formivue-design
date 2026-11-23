// vue-settings-form — CornerInput (port de l'ère) : grille de coins
// (topLeft/topRight/bottomLeft/bottomRight/all). useState → ref,
// useEffect → watch. a11y (V8) : les cellules deviennent des <button>
// natifs (aria-pressed/aria-label), divs cliquables d'ère corrigés.
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

export interface ICornerInputProps {
  className?: string
  style?: CSSProperties
  value?: string
  onChange?: (value: string) => void
}

export const CornerInput = defineComponent({
  name: 'DCornerInput',
  inheritAttrs: false,
  props: {
    value: { type: String, default: undefined },
    onChange: {
      type: null as unknown as PropType<(value: string) => void>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const prefix = usePrefix('corner-input')
    const current = ref(props.value)
    watch(
      () => props.value,
      () => {
        if (!props.value) {
          current.value = 'all'
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
            'flex w-fit items-center justify-center gap-1',
            attrs.class as string,
          ),
          style: attrs.style as any,
        },
        [
          h('div', { class: cls(prefix + '-column', 'flex flex-col gap-1') }, [
            cell('topLeft', '┏'),
            cell('bottomLeft', '┗'),
          ]),
          h('div', { class: cls(prefix + '-column', 'flex flex-col gap-1') }, [
            cell('all', '╋'),
          ]),
          h('div', { class: cls(prefix + '-column', 'flex flex-col gap-1') }, [
            cell('topRight', '┓'),
            cell('bottomRight', '┛'),
          ]),
        ],
      )
  },
})
