import type { ISchema } from '@formivue/json-schema'

// Upload maison (V3 backlog levé) : input file natif, envoi XHR si `action`
// (sinon fichier local en URL blob). openFileDialogOnClick antd disparaît.
const UploadProps: ISchema['properties'] = {
  textContent: {
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  accept: {
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  action: {
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  method: {
    type: 'string',
    enum: ['POST', 'PUT', 'PATCH'],
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    'x-component-props': {
      defaultValue: 'POST',
    },
  },
  name: {
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-component-props': {
      placeholder: 'file',
    },
  },
  data: {
    'x-decorator': 'FormItem',
    'x-component': 'ValueInput',
    'x-component-props': {
      include: ['EXPRESSION'],
    },
  },
  headers: {
    'x-decorator': 'FormItem',
    'x-component': 'ValueInput',
    'x-component-props': {
      include: ['EXPRESSION'],
    },
  },
  listType: {
    type: 'string',
    enum: ['text', 'picture', 'picture-card'],
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    'x-component-props': {
      defaultValue: 'text',
    },
  },
  maxCount: {
    type: 'number',
    'x-decorator': 'FormItem',
    'x-component': 'NumberPicker',
  },
  multiple: {
    type: 'boolean',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
  },
  directory: {
    type: 'boolean',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
  },
  showUploadList: {
    type: 'boolean',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
    'x-component-props': {
      defaultChecked: true,
    },
  },
  withCredentials: {
    type: 'boolean',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
  },
}

export const Upload: ISchema & { Dragger?: ISchema } = {
  type: 'object',
  properties: UploadProps,
}

// zone de dépôt : même jeu de props, sans listType (liste texte seule)
Upload.Dragger = {
  type: 'object',
  properties: Object.fromEntries(
    Object.entries(UploadProps ?? {}).filter(([key]) => key !== 'listType'),
  ),
}
