import type { ISchema } from '@formivue/json-schema'

export const DatePicker: ISchema & { RangePicker?: ISchema } = {
  type: 'object',
  properties: {
    showTime: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
    },
    placeholder: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
}

DatePicker.RangePicker = {
  type: 'object',
  properties: DatePicker.properties,
}
