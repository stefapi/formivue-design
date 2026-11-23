// formivue/vue — Checkbox (+ Checkbox.Group maison : N checkboxes vue-ui sur
// une valeur tableau — il n'existe pas de CheckboxGroup headless, V2/V3).
import { defineComponent, h, type PropType, type Component } from 'vue'
import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import { Checkbox as DCheckbox } from '@formivue-design/vue-ui'
import type { ISelectOption } from '@formivue-design/vue-ui'
import { createBehavior, createResource } from '@formivue-design/core'
import type { DnFC } from '@formivue-design/vue'
import { PreviewText } from '../../preview-text'
import { createFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

const CheckboxGroup = defineComponent({
  name: 'DCheckboxGroup',
  inheritAttrs: false,
  props: {
    options: { type: Array as PropType<ISelectOption[]>, default: () => [] },
    value: {
      type: Array as PropType<(string | number)[]>,
      default: () => [],
    },
    onChange: {
      type: Function as PropType<(value: (string | number)[]) => void>,
      default: undefined,
    },
    disabled: { type: Boolean, default: false },
    exclusive: { type: Boolean, default: false },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit }) {
    return () => {
      const current = props.value ?? []
      const selected = props.exclusive
        ? current
            .filter((value) =>
              props.options.some((option) => option.value === value),
            )
            .slice(0, 1)
        : current
      return h(
        'div',
        {
          ...attrs,
          class: ['flex flex-wrap gap-4', attrs.class as string],
          role: 'group',
        },
        props.options.map((option) =>
          h(
            DCheckbox,
            {
              key: String(option.value),
              value: selected.includes(option.value),
              disabled: props.disabled || option.disabled,
              onChange: (checked: boolean) => {
                const next = checked
                  ? (props.exclusive ? [] : selected).concat(option.value)
                  : selected.filter((value) => value !== option.value)
                emit('update:value', next)
                props.onChange?.(next)
              },
            },
            { default: () => option.label },
          ),
        ),
      )
    }
  },
})

export const Checkbox: DnFC<any> & { Group?: Component } = connect(
  DCheckbox,
  mapReadPretty(PreviewText as any),
) as any

Checkbox.Group = connect(
  CheckboxGroup,
  mapProps({ dataSource: 'options' } as any),
  mapReadPretty(PreviewText.Select as any),
)

Checkbox.Behavior = createBehavior({
  name: 'Checkbox.Group',
  extends: ['Field'],
  selector: (node) => node.props['x-component'] === 'Checkbox.Group',
  designerProps: {
    propsSchema: createFieldSchema(AllSchemas.Checkbox.Group),
  },
  designerLocales: AllLocales.CheckboxGroup,
})

Checkbox.Resource = createResource({
  icon: 'CheckboxGroupSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        type: 'Array<string | number>',
        title: 'Checkbox Group',
        'x-decorator': 'FormItem',
        'x-component': 'Checkbox.Group',
        enum: [
          { label: 'Option 1', value: 1 },
          { label: 'Option 2', value: 2 },
        ],
      },
    },
  ],
})
