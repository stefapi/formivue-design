import { defineComponent, h } from 'vue'
import { usePrefix, usePosition } from '../hooks'
import { Layout } from '../containers'
import cls from 'classnames'

export interface IStudioPanelProps {
  style?: any
  className?: string
  logo?: any
  actions?: any
  prefixCls?: string
  theme?: string
  position?: 'fixed' | 'absolute' | 'relative'
}

// logo/actions : slots nommés (l'ère les passait en ReactNode props —
// écart de forme §1.5, slots = children Vue) ; les props sont acceptées
// aussi si elles portent un VNode.
const StudioPanelInternal = defineComponent({
  name: 'StudioPanelInternal',
  inheritAttrs: false,
  props: {
    logo: { type: null, default: undefined },
    actions: { type: null, default: undefined },
  },
  setup(props, { slots, attrs }) {
    const prefix = usePrefix('main-panel')
    const position = usePosition()
    return () => {
      const classNameBase = cls('root', position, (attrs as any).class)
      const logo = slots.logo ? slots.logo() : props.logo
      const actions = slots.actions ? slots.actions() : props.actions
      const baseProps = {
        style: (attrs as any).style,
        role: 'main',
      }
      // Structure d'ère (panels/styles.less) en utilitaires (V6) : le
      // conteneur est une colonne flex plein écran (la classe utilitaire
      // `fixed` du usePosition gère le positionnement + inset-0), le panneau
      // prend le reste (flex-1 min-h-0 overflow hidden). Sans header, le
      // panneau EST l'élément positionné (classNameBase porte fixed+inset).
      const containerClass = cls(
        'flex grow flex-col',
        position === 'fixed' && 'inset-0',
      )
      const panelFlowClass =
        'relative flex h-full min-h-0 w-full flex-1 overflow-hidden'
      const panelRootClass = cls(
        'flex h-full min-h-0 w-full flex-1 overflow-hidden',
        position === 'fixed' && 'inset-0',
      )
      if (logo || actions) {
        return h(
          'div',
          {
            ...baseProps,
            class: cls(`${prefix}-container`, classNameBase, containerClass),
          },
          [
            h(
              'div',
              {
                class: cls(
                  prefix + '-header',
                  'flex shrink-0 items-center justify-between border-b border-border bg-background p-1',
                ),
              },
              [
                h('div', { class: prefix + '-header-logo flex items-center' }, [
                  logo,
                ]),
                h(
                  'div',
                  {
                    class:
                      prefix + '-header-actions flex items-center justify-end',
                  },
                  [actions],
                ),
              ],
            ),
            h('div', { class: cls(prefix, panelFlowClass) }, slots.default?.()),
          ],
        )
      }
      return h(
        'div',
        { ...baseProps, class: cls(prefix, classNameBase, panelRootClass) },
        slots.default?.(),
      )
    }
  },
})

export const StudioPanel = defineComponent({
  name: 'StudioPanel',
  props: {
    prefixCls: { type: String, default: undefined },
    theme: { type: String, default: undefined },
    position: { type: String, default: undefined },
    logo: { type: null, default: undefined },
    actions: { type: null, default: undefined },
  },
  setup(props, { slots }) {
    return () =>
      h(
        Layout,
        {
          theme: props.theme,
          prefixCls: props.prefixCls,
          position: props.position,
        },
        {
          default: () =>
            h(
              StudioPanelInternal,
              { logo: props.logo, actions: props.actions } as any,
              {
                default: () => slots.default?.(),
                logo: () => slots.logo?.(),
                actions: () => slots.actions?.(),
              },
            ),
        },
      )
  },
})
