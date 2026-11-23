// vue-settings-form — CollapseItem (port de l'ère) : groupe repliable des
// panneaux de settings ( décoré par les schemas CSSStyle/Field). Le header
// bascule expand ; a11y (V8) : header <button> + aria-expanded (div
// cliquable d'ère corrigée).
import { defineComponent, h, ref, type CSSProperties, type PropType } from 'vue'
import { observer } from '@formivue/reactive-vue'
import { useField } from '@formivue/vue'
import { usePrefix, IconWidget } from '@formivue-design/vue'
import cls from 'classnames'

export interface ICollapseItemProps {
  className?: string
  style?: CSSProperties
  defaultExpand?: boolean
}

export const CollapseItem = observer(
  defineComponent({
    name: 'DCollapseItem',
    inheritAttrs: false,
    props: {
      defaultExpand: {
        type: Boolean as PropType<boolean>,
        default: undefined,
      },
    },
    setup(props, { attrs, slots }) {
      const prefix = usePrefix('collapse-item')
      const field = useField<any>()
      const expand = ref(props.defaultExpand ?? true)
      return () =>
        h(
          'div',
          {
            class: cls(prefix, attrs.class as string, { expand: expand.value }),
            style: attrs.style as any,
          },
          [
            h(
              'button',
              {
                type: 'button',
                'aria-expanded': expand.value ? 'true' : 'false',
                // d'ère : bandeau pleine largeur (déborde le padding 20px du
                // formulaire), filets haut/bas, fond panneau actif, 13px
                class: cls(
                  prefix + '-header',
                  '-mx-5 -mt-px flex w-[calc(100%+2.5rem)] cursor-pointer items-center border-y border-border bg-muted px-5 py-[5px] text-left text-[13px] transition-colors hover:bg-accent',
                ),
                onClick: (e: Event) => {
                  e.stopPropagation()
                  e.preventDefault()
                  expand.value = !expand.value
                },
              },
              [
                h(
                  'span',
                  {
                    class: cls(
                      prefix + '-header-expand',
                      '-ml-[13px] mr-[3px] inline-flex text-xs transition-transform duration-150',
                      !expand.value && '-rotate-90',
                    ),
                  },
                  [h(IconWidget, { infer: 'Expand', size: 10 })],
                ),
                h(
                  'span',
                  {
                    class: cls(
                      prefix + '-header-content',
                      'text-sm text-foreground',
                    ),
                  },
                  field.value?.title ?? null,
                ),
              ],
            ),
            h(
              'div',
              {
                class: cls(
                  prefix + '-content',
                  'w-full pt-1 [&>div:last-child]:border-b-0',
                  { hidden: !expand.value },
                ),
              },
              slots.default?.(),
            ),
          ],
        )
    },
  }) as any,
)
