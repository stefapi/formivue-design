import type { ISchema } from '@formivue/json-schema'

export const sliderNumberInputProps = { stepSnapping: false }

export const Slider: ISchema = {
  type: 'object',
  properties: {
    min: {
      type: 'number',
      'x-decorator': 'FormItem',
      'x-component': 'NumberPicker',
      'x-component-props': {
        ...sliderNumberInputProps,
        defaultValue: 0,
      },
    },
    max: {
      type: 'number',
      'x-decorator': 'FormItem',
      'x-component': 'NumberPicker',
      'x-component-props': {
        ...sliderNumberInputProps,
        defaultValue: 100,
      },
    },
    step: {
      type: 'number',
      'x-decorator': 'FormItem',
      'x-component': 'NumberPicker',
      'x-component-props': {
        ...sliderNumberInputProps,
        defaultValue: 1,
      },
      'x-validator': { exclusiveMinimum: 0 },
    },
    showValue: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
      'x-component-props': { defaultChecked: true },
    },
  },
}
