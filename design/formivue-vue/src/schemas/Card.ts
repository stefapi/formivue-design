// Card headless (vue-ui) : title/bordered/size — les props antd (extra, type)
// disparaissent ; l'extra des ArrayCards passe par le slot.
import type { ISchema } from '@formivue/json-schema'

export const Card: ISchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    bordered: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
      'x-component-props': {
        defaultChecked: true,
      },
    },
    size: {
      type: 'string',
      enum: ['default', 'small', null],
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        defaultValue: 'default',
      },
    },
  },
}
