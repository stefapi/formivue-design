import type { ISchema } from '@formivue/json-schema'

// Space headless : direction + size sémantique (small/middle/large — le
// nombre antd 8 disparaît) + wrap.
export const Space: ISchema = {
  type: 'object',
  properties: {
    direction: {
      type: 'string',
      enum: ['vertical', 'horizontal'],
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      'x-component-props': {
        defaultValue: 'horizontal',
        optionType: 'button',
      },
    },
    size: {
      type: 'string',
      enum: ['small', 'middle', 'large', null],
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        defaultValue: 'small',
      },
    },
    wrap: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
    },
  },
}
