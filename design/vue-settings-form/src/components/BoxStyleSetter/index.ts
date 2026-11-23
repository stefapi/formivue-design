// vue-settings-form — BoxStyleSetter (port de l'ère) : le quadri-input
// margin/padding (all ↔ top/right/bottom/left), sur FoldItem + SizeInput.
// Les labels par défaut portent les icônes Top/Right/Bottom/Left (vnodes
// créés au default props, sémantique defaultProps d'ère).
import { defineComponent, h, type PropType, type VNode } from 'vue'
import { observer } from '@formivue/reactive-vue'
import { useField } from '@formivue/vue'
import { usePrefix, IconWidget } from '@formivue-design/vue'
import { FoldItem } from '../FoldItem'
import { SizeInput } from '../SizeInput'
import { InputItems } from '../InputItems'
import cls from 'classnames'

type Position = 'top' | 'right' | 'left' | 'bottom' | 'all'

export interface IMarginStyleSetterProps {
  className?: string
  labels?: VNode[]
  value?: string
  onChange?: (value: string) => void
}

const PositionMap = {
  top: 1,
  right: 2,
  bottom: 3,
  left: 4,
  all: 1,
}

const BoxRex =
  /([\d.]+[^\d\s.+-]+)(?:\s+([\d.]+[^\d\s.+-]+)(?:\s+([\d.]+[^\d\s.+-]+)(?:\s+([\d.]+[^\d\s.+-]+))?)?)?/

const defaultLabels = () => [
  h(IconWidget, { infer: 'Top', size: 16 }),
  h(IconWidget, { infer: 'Right', size: 16 }),
  h(IconWidget, { infer: 'Bottom', size: 16 }),
  h(IconWidget, { infer: 'Left', size: 16 }),
]

export const BoxStyleSetter = observer(
  defineComponent({
    name: 'DBoxStyleSetter',
    inheritAttrs: false,
    props: {
      labels: {
        type: Array as PropType<VNode[]>,
        default: () => defaultLabels(),
      },
      value: { type: String, default: undefined },
      onChange: {
        type: null as unknown as PropType<(value: string) => void>,
        default: undefined,
      },
    },
    setup(props, { attrs }) {
      const field = useField<any>()
      const prefix = usePrefix('box-style-setter')
      const createPositionHandler = (
        position: Position,
        handlerProps: IMarginStyleSetterProps,
      ) => {
        const matched = String(handlerProps.value).match(BoxRex) || []
        const value = matched[PositionMap[position]]
        const v1 = matched[1]
        const v2 = matched[2]
        const v3 = matched[3]
        const v4 = matched[4]
        const allEqualls = v1 === v2 && v2 === v3 && v3 === v4
        return {
          ...handlerProps,
          value: position === 'all' ? (allEqualls ? v1 : undefined) : value,
          onChange(value: string) {
            if (position === 'all') {
              handlerProps.onChange?.(
                `${value || '0px'} ${value || '0px'} ${value || '0px'} ${
                  value || '0px'
                }`,
              )
            } else {
              matched[PositionMap[position]] = value
              handlerProps.onChange?.(
                `${matched[1] || '0px'} ${matched[2] || '0px'} ${
                  matched[3] || '0px'
                } ${matched[4] || '0px'}`,
              )
            }
          },
        }
      }
      const sizeAt = (position: Position, iconIndex: number) =>
        h(
          InputItems.Item as any,
          {
            icon: props.labels?.[iconIndex],
          },
          {
            default: () =>
              h(SizeInput as any, {
                ...createPositionHandler(position, props as any),
                exclude: ['inherit', 'auto'],
              }),
          },
        )
      return () =>
        h(
          FoldItem as any,
          {
            label: field.value?.title,
            class: cls(prefix, attrs.class as string),
          },
          {
            default: () => [
              h(
                FoldItem.Base as any,
                {},
                {
                  default: () =>
                    h(SizeInput as any, {
                      ...createPositionHandler('all', props as any),
                      exclude: ['inherit', 'auto'],
                    }),
                },
              ),
              h(
                FoldItem.Extra as any,
                {},
                {
                  default: () =>
                    h(
                      InputItems as any,
                      { width: '50%' },
                      {
                        default: () => [
                          sizeAt('top', 0),
                          sizeAt('right', 1),
                          sizeAt('bottom', 2),
                          sizeAt('left', 3),
                        ],
                      },
                    ),
                },
              ),
            ],
          },
        )
    },
  }) as any,
)
