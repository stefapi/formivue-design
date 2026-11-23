import {
  defineComponent,
  h,
  inject,
  onMounted,
  provide,
  reactive,
  ref,
} from 'vue'
import { each } from '@formivue-design/shared'
import { DesignerLayoutContext } from '../context'
import { IDesignerLayoutContext } from '../types'

// provide doit se faire dans setup (contract Vue) — la valeur fournie est
// reactive pour suivre les changements de props.theme/prefixCls/position
// (l'ère re-provideait à chaque render).
export const Layout = defineComponent({
  name: 'Layout',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: 'dn-' },
    theme: { type: String, default: 'light' },
    position: { type: String, default: 'fixed' },
    variables: { type: Object, default: undefined },
  },
  setup(props, { slots, attrs }) {
    const layout = inject(DesignerLayoutContext, null)
    const rootRef = ref<HTMLDivElement>(null)
    if (!layout) {
      provide(
        DesignerLayoutContext,
        reactive({
          theme: props.theme,
          prefixCls: props.prefixCls,
          position: props.position,
        }) as IDesignerLayoutContext,
      )
    }

    onMounted(() => {
      if (rootRef.value) {
        each(props.variables, (value, key) => {
          rootRef.value.style.setProperty(`--${key}`, value)
        })
      }
    })

    return () => {
      if (layout) {
        return slots.default?.()
      }
      return h(
        'div',
        {
          ...attrs,
          ref: rootRef,
          class: [
            `${props.prefixCls}app`,
            props.theme ? `${props.prefixCls}${props.theme}` : '',
            'h-full w-full',
            props.theme === 'dark'
              ? 'bg-background text-foreground'
              : 'bg-background text-foreground',
            (attrs.class as string) || '',
          ],
        },
        slots.default?.(),
      )
    }
  },
})
