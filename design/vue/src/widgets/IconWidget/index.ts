import {
  computed,
  defineComponent,
  h,
  inject,
  isVNode,
  cloneVNode,
  onMounted,
  provide,
  ref,
  type InjectionKey,
  type VNode,
} from 'vue'
import { isStr, isFn, isObj, isPlainObj } from '@formivue-design/shared'
import { observer } from '@formivue/reactive-vue'
import { Tooltip } from '@formivue-design/vue-ui'
import { usePrefix, useRegistry, useTheme } from '../../hooks'
import cls from 'classnames'

const isNumSize = (val: any) => /^[\d.]+$/.test(val)

export interface IconProviderProps {
  tooltip?: boolean
}

export interface IShadowSVGProps {
  content?: string
  width?: number | string
  height?: number | string
}
export interface IIconWidgetProps {
  tooltip?: string | VNode | { title?: string | VNode; placement?: string }
  infer: string | VNode | ((props?: any) => any) | { shadow?: string }
  size?: number | string
}

// interne (l'ère gardait son IconContext au niveau module, non exporté)
const IconContext: InjectionKey<IconProviderProps> = Symbol('IconContext')

const IconWidgetInternal = observer(
  defineComponent({
    name: 'IconWidget',
    inheritAttrs: false,
    props: {
      tooltip: { type: [String, Object] as any, default: undefined },
      infer: {
        type: [String, Object, Function] as any,
        default: undefined,
      },
      size: { type: [Number, String], default: undefined },
    },
    setup(props, { attrs, slots }) {
      const theme = useTheme()
      const context = inject(IconContext, null)
      const registry = useRegistry()
      const prefix = usePrefix('icon')

      const size = computed(() => props.size || '1em')
      const height = computed(() => (attrs.style as any)?.height || size.value)
      const width = computed(() => (attrs.style as any)?.width || size.value)

      const takeIcon = (infer: any): any => {
        if (isStr(infer)) {
          const finded = registry.getDesignerIcon(infer)
          if (finded) {
            return takeIcon(finded)
          }
          return h('img', {
            src: infer,
            alt: '',
            height: height.value,
            width: width.value,
          })
        } else if (isFn(infer)) {
          // icones du package = vnode factories (p?: any) => h('svg', {...p}) —
          // sémantique cloneElement d'ère (props fusionnées à la racine)
          return (infer as any)({
            height: height.value,
            width: width.value,
            fill: 'currentColor',
          })
        } else if (isVNode(infer)) {
          if ((infer.type as string) === 'svg') {
            return cloneVNode(infer, {
              height: height.value,
              width: width.value,
              fill: 'currentColor',
              viewBox: (infer.props as any)?.viewBox || '0 0 1024 1024',
              focusable: 'false',
              'aria-hidden': 'true',
            } as any)
          } else if (
            (infer.type as string) === 'path' ||
            (infer.type as string) === 'g'
          ) {
            return h(
              'svg',
              {
                viewBox: '0 0 1024 1024',
                height: height.value,
                width: width.value,
                fill: 'currentColor',
                focusable: 'false',
                'aria-hidden': 'true',
              },
              [infer],
            )
          }
          return infer
        } else if (isPlainObj(infer)) {
          if ((infer as any)[theme]) {
            return takeIcon((infer as any)[theme])
          } else if ((infer as any)['shadow']) {
            return h(IconWidget.ShadowSVG, {
              width: width.value,
              height: height.value,
              content: (infer as any)['shadow'],
            })
          }
          return null
        }
        return null
      }

      const renderTooltips = (children: VNode): any => {
        if (!isStr(props.infer) && context?.tooltip) return children
        const tooltip =
          props.tooltip ||
          (isStr(props.infer)
            ? registry.getDesignerMessage(`icons.${props.infer}`)
            : undefined)
        if (tooltip) {
          const title =
            isStr(tooltip) || isVNode(tooltip)
              ? tooltip
              : (tooltip as any).title
          const rawProps =
            isStr(tooltip) || isVNode(tooltip)
              ? {}
              : isObj(tooltip)
                ? (tooltip as any)
                : {}
          // `title` est le CONTENU du tooltip (slot) — pas une prop du composant
          // Tooltip de vue-ui : on ne le propage pas (sinon il fuit en attribut
          // sur le trigger via le fallthrough)
          const tooltipProps = { ...rawProps } as any
          delete tooltipProps.title
          return h(
            Tooltip,
            { ...tooltipProps, content: undefined },
            {
              default: () => children,
              content: () => title as any,
            },
          )
        }
        return children
      }

      return () => {
        if (!props.infer) return null
        return renderTooltips(
          h(
            'span',
            {
              ...attrs,
              // reset d'ère antd-icon (IconWidget/styles.less) en utilitaires
              class: cls(
                prefix,
                'inline-block text-center align-[-0.125em] leading-none',
                (attrs as any).class,
              ),
              style: {
                ...(attrs.style as any),
                cursor: (attrs as any).onClick
                  ? 'pointer'
                  : (attrs.style as any)?.cursor,
              },
            },
            [takeIcon(props.infer), slots.default?.()],
          ),
        )
      }
    },
  }),
)

const ShadowSVG = defineComponent({
  name: 'IconWidget.ShadowSVG',
  props: {
    content: { type: String, default: undefined },
    width: { type: [Number, String], default: undefined },
    height: { type: [Number, String], default: undefined },
  },
  setup(props) {
    const rootRef = ref<HTMLDivElement>(null)
    const width = isNumSize(props.width) ? `${props.width}px` : props.width
    const height = isNumSize(props.height) ? `${props.height}px` : props.height
    onMounted(() => {
      if (rootRef.value) {
        const root = rootRef.value.attachShadow({
          mode: 'open',
        })
        root.innerHTML = `<svg viewBox="0 0 1024 1024" style="width:${width};height:${height}">${props.content}</svg>`
      }
    })
    return () => h('div', { ref: rootRef })
  },
})

const Provider = defineComponent({
  name: 'IconWidget.Provider',
  props: {
    tooltip: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    provide(IconContext, { tooltip: props.tooltip })
    return () => slots.default?.()
  },
})

IconWidgetInternal.ShadowSVG = ShadowSVG
IconWidgetInternal.Provider = Provider

export const IconWidget = IconWidgetInternal as typeof IconWidgetInternal & {
  Provider: typeof Provider
  ShadowSVG: typeof ShadowSVG
}
