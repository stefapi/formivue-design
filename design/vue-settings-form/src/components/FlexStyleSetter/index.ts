// vue-settings-form — FlexStyleSetter (port de l'ère) : les 5 règles flex
// (direction/wrap/alignContent/justifyContent/alignItems), chaque champ
// décoré par InputItems.Item (décorateur formivue, contrat d'ère) + composé
// par Radio.Group (optionType button d'ère → groupe vue-ui, écart visuel).
import { defineComponent, h, type CSSProperties, type PropType } from 'vue'
import { observer } from '@formivue/reactive-vue'
import { Field, useField } from '@formivue/vue'
import { usePrefix, IconWidget } from '@formivue-design/vue'
import { Radio as FormivueRadio } from '@formivue-design/formivue-vue'
import { InputItems } from '../InputItems'
import cls from 'classnames'

export interface IFlexStyleSetterProps {
  className?: string
  style?: CSSProperties
}

// a11y (V8) : les options à icône portent un ariaLabel explicite (la valeur
// CSS est le nom le plus fidèle : row/column/flex-start…)
const withAria = (dataSource: any[]) =>
  dataSource.map((o) => ({ ...o, ariaLabel: String(o.value) }))

const flexField = (
  name: string,
  dataSource: any[],
  basePath: any,
  prefix: string,
) =>
  h(Field as any, {
    name,
    basePath,
    dataSource: withAria(dataSource),
    reactions: (field: any) => {
      field.decorator[1] = field.decorator[1] || {}
      field.decorator[1].title = `${prefix} : ${field.value || ''}`
    },
    decorator: [InputItems.Item],
    component: [FormivueRadio.Group as any, { optionType: 'button' }],
  })

export const FlexStyleSetter = observer(
  defineComponent({
    name: 'DFlexStyleSetter',
    inheritAttrs: false,
    props: {
      className: { type: String, default: undefined },
      style: { type: Object as PropType<CSSProperties>, default: undefined },
    },
    setup(props) {
      const field = useField<any>()
      const prefix = usePrefix('flex-style-setter')
      const basePath = () => field.value?.address?.parent()
      return () =>
        h(
          'div',
          {
            class: cls(prefix, props.className, 'flex flex-col gap-1'),
            style: props.style,
          },
          [
            h(
              InputItems as any,
              { vertical: true },
              {
                default: () => [
                  flexField(
                    'flexDirection',
                    [
                      {
                        label: h(IconWidget, { infer: 'FlexDirectionRow' }),
                        value: 'row',
                      },
                      {
                        label: h(IconWidget, { infer: 'FlexDirectionColumn' }),
                        value: 'column',
                      },
                    ],
                    basePath(),
                    'Flex Direction',
                  ),
                  flexField(
                    'flexWrap',
                    [
                      {
                        label: h(IconWidget, { infer: 'FlexNoWrap' }),
                        value: 'nowrap',
                      },
                      {
                        label: h(IconWidget, { infer: 'FlexWrap' }),
                        value: 'wrap',
                      },
                    ],
                    basePath(),
                    'Flex Wrap',
                  ),
                  flexField(
                    'alignContent',
                    [
                      {
                        label: h(IconWidget, {
                          infer: 'FlexAlignContentCenter',
                        }),
                        value: 'center',
                      },
                      {
                        label: h(IconWidget, {
                          infer: 'FlexAlignContentStart',
                        }),
                        value: 'flex-start',
                      },
                      {
                        label: h(IconWidget, { infer: 'FlexAlignContentEnd' }),
                        value: 'flex-end',
                      },
                      {
                        label: h(IconWidget, {
                          infer: 'FlexAlignContentSpaceAround',
                        }),
                        value: 'space-around',
                      },
                      {
                        label: h(IconWidget, {
                          infer: 'FlexAlignContentSpaceBetween',
                        }),
                        value: 'space-between',
                      },
                      {
                        label: h(IconWidget, {
                          infer: 'FlexAlignContentStretch',
                        }),
                        value: 'stretch',
                      },
                    ],
                    basePath(),
                    'Align Content',
                  ),
                  flexField(
                    'justifyContent',
                    [
                      {
                        label: h(IconWidget, { infer: 'FlexJustifyCenter' }),
                        value: 'center',
                      },
                      {
                        label: h(IconWidget, { infer: 'FlexJustifyStart' }),
                        value: 'flex-start',
                      },
                      {
                        label: h(IconWidget, { infer: 'FlexJustifyEnd' }),
                        value: 'flex-end',
                      },
                      {
                        label: h(IconWidget, {
                          infer: 'FlexJustifySpaceAround',
                        }),
                        value: 'space-around',
                      },
                      {
                        label: h(IconWidget, {
                          infer: 'FlexJustifySpaceBetween',
                        }),
                        value: 'space-between',
                      },
                      {
                        label: h(IconWidget, {
                          infer: 'FlexJustifySpaceEvenly',
                        }),
                        value: 'space-evenly',
                      },
                    ],
                    basePath(),
                    'Justify Content',
                  ),
                  flexField(
                    'alignItems',
                    [
                      {
                        label: h(IconWidget, { infer: 'FlexAlignItemsCenter' }),
                        value: 'center',
                      },
                      {
                        label: h(IconWidget, { infer: 'FlexAlignItemsStart' }),
                        value: 'flex-start',
                      },
                      {
                        label: h(IconWidget, { infer: 'FlexAlignItemsEnd' }),
                        value: 'flex-end',
                      },
                      {
                        label: h(IconWidget, {
                          infer: 'FlexAlignItemsStretch',
                        }),
                        value: 'stretch',
                      },
                      {
                        label: h(IconWidget, {
                          infer: 'FlexAlignItemsBaseline',
                        }),
                        value: 'baseline',
                      },
                    ],
                    basePath(),
                    'Align Items',
                  ),
                ],
              },
            ),
          ],
        )
    },
  }) as any,
)
