import type { ISchema } from '@formivue/json-schema'

// Transfer maison (V3 backlog levé) : options depuis field.dataSource
// (label/value), valeur = valeurs de la liste cible ; filterOption (fonction
// antd) remplacé par la recherche intégrée.
export const Transfer: ISchema = {
  type: 'object',
  properties: {
    oneWay: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
    },
    showSearch: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
    },
    showSelectAll: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
      'x-component-props': {
        defaultChecked: true,
      },
    },
    titles: {
      'x-decorator': 'FormItem',
      'x-component': 'ValueInput',
      'x-component-props': {
        include: ['EXPRESSION'],
      },
    },
    operations: {
      'x-decorator': 'FormItem',
      'x-component': 'ValueInput',
      'x-component-props': {
        include: ['EXPRESSION'],
      },
    },
  },
}
