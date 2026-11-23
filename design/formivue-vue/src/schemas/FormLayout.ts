// FormLayout headless (vue-ui) : layout/labelAlign/labelWidth/size —
// consommés via FormLayoutKey par FormItemBase. Les props antd (labelCol,
// wrapperCol, colon, feedbackLayout, tooltipLayout…) disparaissent (V1).
import type { ISchema } from '@formivue/json-schema'

export const FormLayout = {
  type: 'object',
  properties: {
    layout: {
      type: 'string',
      enum: ['vertical', 'horizontal', null],
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        defaultValue: null,
      },
    },
    labelAlign: {
      type: 'string',
      enum: ['left', 'right', null],
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        defaultValue: 'right',
      },
    },
    labelWidth: {
      'x-decorator': 'FormItem',
      'x-component': 'SizeInput',
    },
    size: {
      type: 'string',
      enum: ['large', 'middle', 'small', null],
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        defaultValue: 'middle',
      },
    },
  },
} satisfies ISchema
