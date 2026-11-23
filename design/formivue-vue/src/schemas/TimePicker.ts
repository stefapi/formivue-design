import type { ISchema } from '@formivue/json-schema'

export const TimePicker: ISchema & { RangePicker?: ISchema } = {
  type: 'object',
  properties: {
    placeholder: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
}

TimePicker.RangePicker = {
  type: 'object',
  properties: {},
}
