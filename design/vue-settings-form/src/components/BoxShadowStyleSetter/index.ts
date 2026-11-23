// vue-settings-form — BoxShadowStyleSetter (port de l'ère) : connecteur
// positionnel sur les 5 segments de la valeur box-shadow
// (x y blur spread color) — FoldItem + ColorInput + SizeInput×4.
import { defineComponent, h, type CSSProperties, type PropType } from 'vue'
import { observer } from '@formivue/reactive-vue'
import { useField } from '@formivue/vue'
import { usePrefix } from '@formivue-design/vue'
import { FoldItem } from '../FoldItem'
import { ColorInput } from '../ColorInput'
import { SizeInput } from '../SizeInput'
import { InputItems } from '../InputItems'
import cls from 'classnames'

export interface IBoxShadowStyleSetterProps {
  className?: string
  style?: CSSProperties
  value?: string
  onChange?: (value: string) => void
}

export const BoxShadowStyleSetter = observer(
  defineComponent({
    name: 'DBoxShadowStyleSetter',
    inheritAttrs: false,
    props: {
      className: { type: String, default: undefined },
      style: { type: Object as PropType<CSSProperties>, default: undefined },
      value: { type: String, default: undefined },
      onChange: {
        type: null as unknown as PropType<(value: string) => void>,
        default: undefined,
      },
    },
    setup(props) {
      const field = useField<any>()
      const prefix = usePrefix('shadow-style-setter')
      const createBoxShadowConnector = (position: number) => {
        const splited = String(props.value || '')
          .trim()
          .split(' ')
        return {
          value: splited[position],
          onChange: (value: any) => {
            splited[position] = value
            props.onChange?.(
              `${splited[0] || ''} ${splited[1] || ''} ${splited[2] || ''} ${
                splited[3] || ''
              } ${splited[4] || ''}`,
            )
          },
        }
      }
      const sizeAt = (icon: string, position: number) =>
        h(
          InputItems.Item as any,
          { icon },
          {
            default: () =>
              h(SizeInput as any, {
                exclude: ['inherit', 'auto'],
                ...createBoxShadowConnector(position),
              }),
          },
        )
      return () =>
        h(
          FoldItem as any,
          {
            class: cls(prefix, props.className),
            style: props.style,
            label: field.value?.title,
          },
          {
            default: () => [
              h(
                FoldItem.Base as any,
                {},
                {
                  default: () =>
                    h(ColorInput as any, {
                      ...createBoxShadowConnector(4),
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
                          sizeAt('AxisX', 0),
                          sizeAt('AxisY', 1),
                          sizeAt('Blur', 2),
                          sizeAt('Shadow', 3),
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
