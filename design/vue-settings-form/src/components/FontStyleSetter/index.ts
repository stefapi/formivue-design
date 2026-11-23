// vue-settings-form — FontStyleSetter (port de l'ère) : FoldItem
// (fontFamily) + extra (weight/style/color/size/lineHeight/align/decoration)
// sur les bindings formivue-vue (Select/Radio.Group/NumberPicker) et les
// éditeurs locaux (SizeInput/ColorInput).
import { defineComponent, h, type CSSProperties, type PropType } from 'vue'
import { observer } from '@formivue/reactive-vue'
import { Field, useField } from '@formivue/vue'
import { usePrefix, IconWidget } from '@formivue-design/vue'
import {
  Select as FormivueSelect,
  Radio as FormivueRadio,
  NumberPicker as FormivueNumberPicker,
} from '@formivue-design/formivue-vue'
import { FoldItem } from '../FoldItem'
import { InputItems } from '../InputItems'
import { SizeInput } from '../SizeInput'
import { ColorInput } from '../ColorInput'
import cls from 'classnames'

export interface IFontStyleSetterProps {
  className?: string
  style?: CSSProperties
}

const createFontFamilyOptions = (fonts: string[]) => {
  return fonts.map((font) => {
    const splited = font.split('=')
    const label = splited?.[0]
    const value = splited?.[1]
    return {
      label: h('span', { key: value, style: { fontFamily: value } }, label),
      value,
    }
  })
}

const FontFamilyOptions = createFontFamilyOptions([
  'SimSun=SimSun',
  'Microsoft Yahei=Microsoft Yahei',
  'PingFang SC=PingFang SC',
  'Andale Mono=andale mono,monospace',
  'Arial=arial,helvetica,sans-serif',
  'Arial Black=arial black,sans-serif',
  'Book Antiqua=book antiqua,palatino,serif',
  'Comic Sans MS=comic sans ms,sans-serif',
  'Courier New=courier new,courier,monospace',
  'Georgia=georgia,palatino,serif',
  'Helvetica Neue=Helvetica Neue',
  'Helvetica=helvetica,arial,sans-serif',
  'Impact=impact,sans-serif',
  'Symbol=symbol',
  'Tahoma=tahoma,arial,helvetica,sans-serif',
  'Terminal=terminal,monaco,monospace',
  'Times New Roman=times new roman,times,serif',
  'Trebuchet MS=trebuchet ms,geneva,sans-serif',
  'Verdana=verdana,geneva,sans-serif',
])

export const FontStyleSetter = observer(
  defineComponent({
    name: 'DFontStyleSetter',
    inheritAttrs: false,
    props: {
      className: { type: String, default: undefined },
      style: { type: Object as PropType<CSSProperties>, default: undefined },
    },
    setup(props) {
      const field = useField<any>()
      const prefix = usePrefix('font-style-setter')
      const fieldAt = (
        name: string,
        component: any,
        componentProps?: any,
        dataSource?: any[],
        icon?: string,
        width?: string | number,
      ) =>
        h(
          InputItems.Item as any,
          { icon, width },
          {
            default: () =>
              h(Field as any, {
                name,
                basePath: field.value?.address?.parent(),
                ...(dataSource ? { dataSource } : {}),
                component: [component, componentProps],
              }),
          },
        )
      return () =>
        h(
          FoldItem as any,
          {
            label: field.value?.title,
            class: cls(prefix, props.className),
            style: props.style,
          },
          {
            default: () => [
              h(
                FoldItem.Base as any,
                {},
                {
                  default: () =>
                    h(Field as any, {
                      name: 'fontFamily',
                      basePath: field.value?.address?.parent(),
                      component: [
                        FormivueSelect as any,
                        {
                          style: { width: '100%' },
                          placeholder: 'Helvetica Neue',
                        },
                      ],
                      dataSource: FontFamilyOptions,
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
                      {},
                      {
                        default: () => [
                          fieldAt(
                            'fontWeight',
                            FormivueNumberPicker as any,
                            { placeholder: '400' },
                            undefined,
                            'FontWeight',
                            '50%',
                          ),
                          fieldAt(
                            'fontStyle',
                            FormivueRadio.Group as any,
                            { optionType: 'button' },
                            [
                              {
                                label: h(IconWidget, {
                                  infer: 'NormalFontStyle',
                                }),
                                value: 'normal',
                                ariaLabel: 'normal',
                              },
                              {
                                label: h(IconWidget, {
                                  infer: 'ItalicFontStyle',
                                }),
                                value: 'italic',
                                ariaLabel: 'italic',
                              },
                            ],
                            'FontStyle',
                            '50%',
                          ),
                          fieldAt(
                            'color',
                            ColorInput,
                            undefined,
                            undefined,
                            'FontColor',
                            '100%',
                          ),
                          fieldAt(
                            'fontSize',
                            SizeInput as any,
                            { exclude: ['auto'] },
                            undefined,
                            'FontSize',
                            '50%',
                          ),
                          fieldAt(
                            'lineHeight',
                            SizeInput as any,
                            { exclude: ['auto'] },
                            undefined,
                            'LineHeight',
                            '50%',
                          ),
                          fieldAt(
                            'textAlign',
                            FormivueRadio.Group as any,
                            { optionType: 'button' },
                            [
                              {
                                label: h(IconWidget, {
                                  infer: 'TextAlignLeft',
                                }),
                                value: 'left',
                                ariaLabel: 'align left',
                              },
                              {
                                label: h(IconWidget, {
                                  infer: 'TextAlignCenter',
                                }),
                                value: 'center',
                                ariaLabel: 'align center',
                              },
                              {
                                label: h(IconWidget, {
                                  infer: 'TextAlignRight',
                                }),
                                value: 'right',
                                ariaLabel: 'align right',
                              },
                              {
                                label: h(IconWidget, {
                                  infer: 'TextAlignJustify',
                                }),
                                value: 'justify',
                                ariaLabel: 'align justify',
                              },
                            ],
                            'TextAlign',
                          ),
                          fieldAt(
                            'textDecoration',
                            FormivueRadio.Group as any,
                            { optionType: 'button' },
                            [
                              { label: '--', value: 'none' },
                              {
                                label: h(IconWidget, {
                                  infer: 'TextUnderline',
                                }),
                                value: 'underline',
                                ariaLabel: 'underline',
                              },
                              {
                                label: h(IconWidget, {
                                  infer: 'TextLineThrough',
                                }),
                                value: 'line-through',
                                ariaLabel: 'line-through',
                              },
                            ],
                            'TextDecoration',
                          ),
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
