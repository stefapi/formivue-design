// Select headless : multiple booléen (remplace le mode multiple/tags antd)
// + placeholder. Les options viennent de field.dataSource (enum), pas des props.
import type { ISchema } from '@formivue/json-schema'

export const Select: ISchema = {
  type: 'object',
  properties: {
    multiple: {
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
