import type { ISchema } from '@formivue/json-schema'

// Cascader maison (V3 backlog levé) : options depuis field.dataSource (arbre
// label/value/children), valeur = chemin de valeurs ; displayRender/fieldNames
// (fonctions antd) remplacés par un séparateur d'affichage.
export const Cascader: ISchema = {
  type: 'object',
  properties: {
    allowClear: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
      'x-component-props': {
        defaultChecked: true,
      },
    },
    changeOnSelect: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
    },
    separator: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: ' / ',
      },
    },
    placeholder: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
}
