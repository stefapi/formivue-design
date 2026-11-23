// vue-settings-form — FoldItem (port de l'ère) : item repliable des panneaux
// de style — un slot Base (ligne principale) + un slot Extra (détails),
// l'état expand persiste par adresse de champ (ExpandedMap module).
// React.Children.forEach → parcours des vnodes du slot ; FormItem.BaseItem
// (antd) → FormItemBase (vue-ui). Les marqueurs Base/Extra passent par
// `displayName` statique (même contrat qu'ère, components = objets).
import {
  cloneVNode,
  defineComponent,
  h,
  isVNode,
  type Component,
  type PropType,
  type VNode,
} from 'vue'
import { observer } from '@formivue/reactive-vue'
import { observable } from '@formivue/reactive'
import { useField } from '@formivue/vue'
import { usePrefix, IconWidget } from '@formivue-design/vue'
import { uid } from '@formivue-design/shared'
import { FormItemBase } from '@formivue-design/vue-ui'
import cls from 'classnames'

const ExpandedMap = new Map<string, boolean>()

const takeChildren = (vnode: VNode): VNode[] => {
  const children = vnode.children as any
  if (children?.default) {
    // normalise (slot → vnode ou tableau, les deux formes existent selon
    // l'appelant) — sans cela le clone d'id ne s'applique pas
    const res = children.default()
    return Array.isArray(res) ? res : [res]
  }
  if (Array.isArray(children)) return children
  return children ? [children] : []
}

const FoldItemInternal = observer(
  defineComponent({
    name: 'DFoldItem',
    inheritAttrs: false,
    props: {
      label: {
        type: [String, Object] as PropType<string | VNode>,
        default: undefined,
      },
    },
    setup(props, { attrs, slots }) {
      const prefix = usePrefix('fold-item')
      const field = useField<any>()
      // observable.ref d'ère : l'état expand est un observable formivue —
      // suivi par l'observer, persisté par adresse de champ.
      const expand = observable.ref(
        ExpandedMap.get(field.value?.address?.toString()),
      )
      const take = (marker: string) => {
        const list = slots.default?.() ?? []
        for (const vnode of list) {
          if ((vnode.type as any)?.displayName === marker) {
            return takeChildren(vnode)
          }
        }
        return null
      }
      // a11y (V8) : le label du FormItemBase doit associer l'éditeur du slot
      // Base — id injecté sur le premier vnode (port du fix 6.4/FormItem),
      // l'éditeur polymorphe le forwarde à son input interne.
      const baseId = `${field.value?.address?.toString() ?? 'fold'}-${uid()}`
      return () => {
        const base = take('FoldItem.Base')
        const extra = take('FoldItem.Extra')
        const patchedBase =
          base && base.length === 1 && isVNode(base[0])
            ? base.map((child) => cloneVNode(child, { id: baseId }, true))
            : base
        return h('div', { class: cls(prefix, attrs.class as string) }, [
          h(
            'div',
            {
              class: cls(prefix + '-base', 'cursor-pointer'),
              onClick: () => {
                expand.value = !expand.value
                ExpandedMap.set(field.value?.address?.toString(), expand.value)
              },
            },
            [
              h(
                FormItemBase,
                {
                  ...attrs,
                  labelFor: baseId,
                  label: h(
                    'span',
                    {
                      // d'ère : chevron dans la marge gauche, pivoté -90° replié
                      class: cls(
                        prefix + '-title',
                        '-ml-2.5 flex cursor-pointer items-center gap-0.5',
                        '[&_svg]:transition-transform [&_svg]:duration-150',
                        !expand.value && '[&_svg]:-rotate-90',
                        { expand: expand.value },
                      ),
                    },
                    [
                      extra
                        ? h(IconWidget, { infer: 'Expand', size: 10 })
                        : null,
                      props.label,
                    ],
                  ),
                },
                {
                  default: () => [
                    h(
                      'div',
                      {
                        style: { width: '100%' },
                        onClick: (e: Event) => {
                          e.stopPropagation()
                        },
                      },
                      patchedBase,
                    ),
                  ],
                },
              ),
            ],
          ),
          expand.value && extra
            ? h(
                'div',
                {
                  // d'ère : bloc déplié sur fond surligné, collé à la ligne
                  class: cls(
                    prefix + '-extra',
                    '-mx-2.5 -mt-2 mb-2.5 bg-muted px-2.5 pt-2.5 pb-px',
                  ),
                },
                extra,
              )
            : null,
        ])
      }
    },
  }) as any,
)

const Base = defineComponent({
  name: 'DFoldItemBase',
  setup: () => () => h('template'),
}) as any
Base.displayName = 'FoldItem.Base'

const Extra = defineComponent({
  name: 'DFoldItemExtra',
  setup: () => () => h('template'),
}) as any
Extra.displayName = 'FoldItem.Extra'

export const FoldItem = FoldItemInternal as typeof FoldItemInternal & {
  Base: Component
  Extra: Component
}

FoldItem.Base = Base
FoldItem.Extra = Extra
