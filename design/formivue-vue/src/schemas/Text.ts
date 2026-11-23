import type { ISchema } from '@formivue/json-schema'

export const Text: ISchema = {
  type: 'object',
  properties: {
    format: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': { defaultValue: 'text' },
      enum: ['text', 'html'],
    },
    content: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-component-props': { rows: 4 },
    },
    mode: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        defaultValue: 'normal',
      },
      enum: ['h1', 'h2', 'h3', 'p', 'normal'],
      'x-reactions': {
        fulfill: {
          state: {
            display:
              '{{ $values["x-component-props"]?.format === "html" ? "hidden" : "visible" }}',
          },
        },
      },
    },
  },
}
