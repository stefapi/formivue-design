import type { ISchema } from '@formivue/json-schema'

// ArrayTable maison (vue-ui) : le rendu est celui de la Table sémantique —
// les props antd (bordered/showHeader/sticky/tableLayout/size) disparaissent.
// Column : title/align/width réels de la Table maison.
// Addition : method/defaultValue consommés par ArrayBase.Addition.
export const ArrayTable: ISchema & {
  Addition?: ISchema
  Column?: ISchema
} = {
  type: 'object',
  properties: {},
}

const Column: ISchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    align: {
      type: 'string',
      enum: ['left', 'right', 'center'],
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      'x-component-props': {
        defaultValue: 'left',
        optionType: 'button',
      },
    },
    width: {
      type: 'number',
      'x-decorator': 'FormItem',
      'x-component': 'NumberPicker',
    },
  },
}

const Addition: ISchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    method: {
      type: 'string',
      enum: ['push', 'unshift'],
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      'x-component-props': {
        defaultValue: 'push',
        optionType: 'button',
      },
    },
    defaultValue: {
      'x-decorator': 'FormItem',
      'x-component': 'ValueInput',
      'x-component-props': { include: ['JSON', 'EXPRESSION'] },
    },
  },
}

ArrayTable.Column = Column
ArrayTable.Addition = Addition
