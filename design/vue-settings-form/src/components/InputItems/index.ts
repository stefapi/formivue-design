// vue-settings-form — InputItems / InputItems.Item (port de l'ère) :
// conteneurs de mise en forme des éditeurs composites (l'Item sert aussi de
// **décorateur formivue** — FlexStyleSetter — contrat d'ère conservé).
// createContext/useContext → InjectionKey + provide/inject.
import {
  defineComponent,
  h,
  inject,
  provide,
  type InjectionKey,
  type VNode,
} from 'vue'
import { usePrefix, IconWidget } from '@formivue-design/vue'
import cls from 'classnames'

export interface IInputItemsContext {
  width?: string | number
  vertical?: boolean
}

export interface IInputItemsProps {
  className?: string
  width?: string | number
  vertical?: boolean
}

export interface IInputItemProps {
  className?: string
  icon?: VNode | string
  width?: string | number
  vertical?: boolean
  title?: VNode | string
}

const InputItemsContext: InjectionKey<IInputItemsContext> =
  Symbol('InputItemsContext')

const InputItemsBase = defineComponent({
  name: 'DInputItems',
  inheritAttrs: false,
  props: {
    width: { type: [String, Number], default: '100%' },
    vertical: { type: Boolean, default: undefined },
  },
  setup(props, { slots }) {
    const prefix = usePrefix('input-items')
    // provide au setup (le provider rend ses enfants après — l'ère
    // fournissait le contexte au rendu, sémantique identique en Vue)
    provide(InputItemsContext, props)
    return () =>
      h(
        'div',
        { class: cls(prefix, '-ml-2 flex flex-wrap') },
        slots.default?.(),
      )
  },
})

const Item = defineComponent({
  name: 'DInputItemsItem',
  inheritAttrs: false,
  props: {
    icon: { type: [String, Object] as any, default: undefined },
    width: { type: [String, Number], default: undefined },
    vertical: { type: Boolean, default: undefined },
    title: { type: [String, Object] as any, default: undefined },
  },
  setup(props, { slots }) {
    const prefix = usePrefix('input-items-item')
    const ctx = inject(InputItemsContext, {} as IInputItemsContext)
    return () =>
      h(
        'div',
        {
          class: cls(
            prefix,
            'mb-2.5 flex',
            props.vertical || ctx.vertical
              ? 'vertical flex-col items-start gap-1 pl-2 [&>*:last-child]:w-full'
              : 'items-center',
          ),
          style: { width: props.width || ctx.width } as any,
        },
        [
          props.icon
            ? h(
                'div',
                {
                  class: cls(
                    prefix + '-icon',
                    'mx-2 inline-flex shrink-0 grow-0 items-center justify-center text-foreground/80',
                  ),
                },
                [h(IconWidget, { infer: props.icon as any, size: 16 })],
              )
            : null,
          props.title
            ? h(
                'div',
                {
                  class: cls(
                    prefix + '-title',
                    'text-xs text-muted-foreground',
                  ),
                },
                [props.title as any],
              )
            : null,
          h(
            'div',
            { class: cls(prefix + '-controller', 'min-w-0 flex-1') },
            slots.default?.(),
          ),
        ],
      )
  },
})

export const InputItems = InputItemsBase as typeof InputItemsBase & {
  Item: typeof Item
}

InputItems.Item = Item as any
