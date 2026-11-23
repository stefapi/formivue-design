// formivue/vue — Input (binding réelle sur vue-ui + matériau designer :
// Behavior/Resource d'ère portés 1:1). Input.TextArea = Textarea vue-ui.
import type { Component } from 'vue'
import { connect, mapReadPretty } from '@formivue/vue'
import { Input as DInput, Textarea as DTextarea } from '@formivue-design/vue-ui'
import { createBehavior, createResource } from '@formivue-design/core'
import type { DnFC } from '@formivue-design/vue'
import { PreviewText } from '../../preview-text'
import { createFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

export const Input: DnFC<any> & { TextArea?: Component } = connect(
  DInput,
  mapReadPretty(PreviewText.Input as any),
) as any

Input.TextArea = connect(DTextarea, mapReadPretty(PreviewText.Input as any))

Input.Behavior = createBehavior(
  {
    name: 'Input',
    extends: ['Field'],
    selector: (node) => node.props['x-component'] === 'Input',
    designerProps: {
      propsSchema: createFieldSchema(AllSchemas.Input),
    },
    designerLocales: AllLocales.Input,
  },
  {
    name: 'Input.TextArea',
    extends: ['Field'],
    selector: (node) => node.props['x-component'] === 'Input.TextArea',
    designerProps: {
      propsSchema: createFieldSchema(AllSchemas.Input.TextArea),
    },
    designerLocales: AllLocales.TextArea,
  },
)

Input.Resource = createResource(
  {
    icon: 'InputSource',
    elements: [
      {
        componentName: 'Field',
        props: {
          type: 'string',
          title: 'Input',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    ],
  },
  {
    icon: 'TextAreaSource',
    elements: [
      {
        componentName: 'Field',
        props: {
          type: 'string',
          title: 'TextArea',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
    ],
  },
)
