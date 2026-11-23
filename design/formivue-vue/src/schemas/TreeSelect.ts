import type { ISchema } from '@formivue/json-schema'

// TreeSelect maison (V3 backlog levé) : options depuis field.dataSource
// (arbre label/value/children) ; `multiple` remplace treeCheckable antd
// (cases à cocher) — les props antd de virtualisation/rendu disparaissent.
export const TreeSelect: ISchema = {
  type: 'object',
  properties: {
    multiple: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
    },
    allowClear: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
      'x-component-props': {
        defaultChecked: true,
      },
    },
    showSearch: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
    },
    treeDefaultExpandAll: {
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
