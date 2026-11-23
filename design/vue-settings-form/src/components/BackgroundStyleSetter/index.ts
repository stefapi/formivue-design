// vue-settings-form — BackgroundStyleSetter (port de l'ère) : FoldItem
// (backgroundColor) + extra (image / size / repeat / position), les champs
// naviguent par Field (basePath = parent du setter).
import { defineComponent, h, type CSSProperties, type PropType } from 'vue'
import { observer } from '@formivue/reactive-vue'
import { Field, useField } from '@formivue/vue'
import { usePrefix } from '@formivue-design/vue'
import { GlobalRegistry } from '@formivue-design/core'
import {
  Select as FormivueSelect,
  Input as FormivueInput,
} from '@formivue-design/formivue-vue'
import { FoldItem } from '../FoldItem'
import { ColorInput } from '../ColorInput'
import { BackgroundSizeInput } from '../SizeInput'
import { BackgroundImageInput } from '../ImageInput'
import { InputItems } from '../InputItems'
import cls from 'classnames'

export interface IBackgroundStyleSetterProps {
  className?: string
  style?: CSSProperties
}

export const BackgroundStyleSetter = observer(
  defineComponent({
    name: 'DBackgroundStyleSetter',
    inheritAttrs: false,
    props: {
      className: { type: String, default: undefined },
      style: { type: Object as PropType<CSSProperties>, default: undefined },
    },
    setup(props) {
      const field = useField<any>()
      const prefix = usePrefix('background-style-setter')
      const item = (
        icon: string,
        name: string,
        component: any,
        componentProps?: any,
        dataSource?: any[],
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
            class: cls(prefix, props.className),
            label: field.value?.title,
          },
          {
            default: () => [
              h(
                FoldItem.Base as any,
                {},
                {
                  default: () =>
                    h(Field as any, {
                      name: 'backgroundColor',
                      basePath: field.value?.address?.parent(),
                      component: [ColorInput],
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
                          item(
                            'Image',
                            'backgroundImage',
                            BackgroundImageInput,
                          ),
                          item(
                            'ImageSize',
                            'backgroundSize',
                            BackgroundSizeInput,
                            undefined,
                            undefined,
                            '50%',
                          ),
                          item(
                            'Repeat',
                            'backgroundRepeat',
                            FormivueSelect as any,
                            {
                              style: { width: '100%' },
                              placeholder:
                                GlobalRegistry.getDesignerMessage(
                                  'SettingComponents.BackgroundStyleSetter.repeat',
                                ) || 'Repeat',
                            },
                            [
                              {
                                label:
                                  GlobalRegistry.getDesignerMessage(
                                    'SettingComponents.BackgroundStyleSetter.noRepeat',
                                  ) || 'No Repeat',
                                value: 'no-repeat',
                              },
                              {
                                label:
                                  GlobalRegistry.getDesignerMessage(
                                    'SettingComponents.BackgroundStyleSetter.repeat',
                                  ) || 'Repeat',
                                value: 'repeat',
                              },
                              {
                                label:
                                  GlobalRegistry.getDesignerMessage(
                                    'SettingComponents.BackgroundStyleSetter.repeatX',
                                  ) || 'Repeat X',
                                value: 'repeat-x',
                              },
                              {
                                label:
                                  GlobalRegistry.getDesignerMessage(
                                    'SettingComponents.BackgroundStyleSetter.repeatY',
                                  ) || 'Repeat Y',
                                value: 'repeat-y',
                              },
                              {
                                label:
                                  GlobalRegistry.getDesignerMessage(
                                    'SettingComponents.BackgroundStyleSetter.space',
                                  ) || 'Space',
                                value: 'space',
                              },
                              {
                                label:
                                  GlobalRegistry.getDesignerMessage(
                                    'SettingComponents.BackgroundStyleSetter.round',
                                  ) || 'Round',
                                value: 'round',
                              },
                            ],
                            '50%',
                          ),
                          item(
                            'Position',
                            'backgroundPosition',
                            FormivueInput as any,
                            {
                              placeholder: 'center center',
                            },
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
