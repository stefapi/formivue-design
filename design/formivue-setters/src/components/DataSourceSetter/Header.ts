// formivue/setters — DataSourceSetter Header (port de l'ère) : titre + extra
// de panneau (arbre gauche / propriétés droite). antd → tokens V6.
import { defineComponent, h, type PropType, type VNode } from 'vue'
import { usePrefix } from '@formivue-design/vue'

export interface IHeaderProps {
  extra?: VNode | VNode[] | null
  title?: VNode | string
}

export const Header = defineComponent({
  name: 'DDataSourceSetterHeader',
  inheritAttrs: false,
  props: {
    title: {
      type: [String, Object] as PropType<string | VNode>,
      default: undefined,
    },
    extra: {
      type: [Object, Array] as PropType<VNode | VNode[] | null>,
      default: undefined,
    },
  },
  setup(props) {
    const prefix = usePrefix('data-source-setter')
    return () =>
      h(
        'div',
        {
          class:
            'flex h-10 shrink-0 items-center justify-between border-b border-border px-3 py-2',
        },
        [
          h(
            'div',
            { class: `${prefix}-layout-item-title text-sm font-medium` },
            [props.title],
          ),
          props.extra ?? null,
        ],
      )
  },
})
