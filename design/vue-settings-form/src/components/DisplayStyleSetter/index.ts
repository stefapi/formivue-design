// vue-settings-form — DisplayStyleSetter (port de l'ère) : radio de
// display (block/inline-block/inline/flex) + champ caché « flex » piloté
// par réaction (visible seulement quand display === 'flex').
// FormItem.BaseItem (antd) → FormItemBase (vue-ui) ; Radio.Group antd →
// Radio vue-ui (groupe, contrat value/onChange direct).
import { defineComponent, h, type CSSProperties, type PropType } from 'vue'
import { observer } from '@formivue/reactive-vue'
import { Field, useField } from '@formivue/vue'
import type { Field as FieldType } from '@formivue/core'
import { usePrefix, IconWidget } from '@formivue-design/vue'
import { GlobalRegistry } from '@formivue-design/core'
import { FormItemBase, Radio as UiRadio } from '@formivue-design/vue-ui'
import { FlexStyleSetter } from '../FlexStyleSetter'
import cls from 'classnames'

export interface IDisplayStyleSetterProps {
  className?: string
  style?: CSSProperties
  value?: string
  onChange?: (value: string) => void
}

export const DisplayStyleSetter = observer(
  defineComponent({
    name: 'DDisplayStyleSetter',
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
      const field = useField<FieldType>()
      const prefix = usePrefix('display-style-setter')
      return () =>
        h('div', { class: 'contents' }, [
          h(
            FormItemBase,
            {
              label: field.value?.title,
              class: cls(prefix, props.className),
              style: props.style,
            },
            {
              default: () =>
                h(UiRadio as any, {
                  class: prefix + '-radio',
                  optionType: 'button',
                  options: [
                    {
                      label: h(IconWidget, { infer: 'DisplayBlock', size: 16 }),
                      value: 'block',
                      ariaLabel:
                        GlobalRegistry.getDesignerMessage(
                          'icons.DisplayBlock',
                        ) || 'Display block',
                    },
                    {
                      label: h(IconWidget, {
                        infer: 'DisplayInlineBlock',
                        size: 16,
                      }),
                      value: 'inline-block',
                      ariaLabel:
                        GlobalRegistry.getDesignerMessage(
                          'icons.DisplayInlineBlock',
                        ) || 'Display inline block',
                    },
                    {
                      label: h(IconWidget, {
                        infer: 'DisplayInline',
                        size: 16,
                      }),
                      value: 'inline',
                      ariaLabel:
                        GlobalRegistry.getDesignerMessage(
                          'icons.DisplayInline',
                        ) || 'Display inline',
                    },
                    {
                      label: h(IconWidget, { infer: 'DisplayFlex', size: 16 }),
                      value: 'flex',
                      ariaLabel:
                        GlobalRegistry.getDesignerMessage(
                          'icons.DisplayFlex',
                        ) || 'Display flex',
                    },
                  ],
                  value: props.value,
                  onChange: (value: string) => {
                    props.onChange?.(value)
                  },
                }),
            },
          ),
          h(Field as any, {
            name: 'flex',
            basePath: field.value?.address?.parent(),
            visible: false,
            reactions: (flexField: FieldType) => {
              flexField.visible = field.value?.value === 'flex'
            },
            component: [FlexStyleSetter],
          }),
        ])
    },
  }) as any,
)
