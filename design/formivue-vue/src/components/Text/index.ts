import { createBehavior, createResource } from '@formivue-design/core'
import { useTreeNode, type DnFC } from '@formivue-design/vue'
import { createVoidFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

import {
  createText,
  type IFormivueDesignTextProps,
} from '@formivue-design/formivue-runtime/bindings'

export type { IFormivueDesignTextProps } from '@formivue-design/formivue-runtime/bindings'

export const Text: DnFC<IFormivueDesignTextProps> = createText(
  useTreeNode,
) as any

Text.Behavior = createBehavior({
  name: 'Text',
  extends: ['Field'],
  selector: (node) => node.props['x-component'] === 'Text',
  designerProps: {
    propsSchema: createVoidFieldSchema(AllSchemas.Text),
  },
  designerLocales: AllLocales.Text,
})

Text.Resource = createResource({
  icon: 'TextSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        type: 'string',
        'x-component': 'Text',
      },
    },
  ],
})
