// Props adaptées headless (V1) : placeholder/maxLength natifs de l'input ;
// les addon/prefix/suffix/allowClear/bordered/size antd disparaissent.
import type { ISchema } from '@formivue/json-schema'

export const Input: ISchema & { TextArea?: ISchema } = {
  type: 'object',
  properties: {
    placeholder: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    maxLength: {
      type: 'number',
      'x-decorator': 'FormItem',
      'x-component': 'NumberPicker',
    },
  },
}

Input.TextArea = {
  type: 'object',
  properties: {
    placeholder: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    maxLength: {
      type: 'number',
      'x-decorator': 'FormItem',
      'x-component': 'NumberPicker',
    },
    autoSize: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
    },
  },
}
