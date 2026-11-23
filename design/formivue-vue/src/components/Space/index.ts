// formivue/vue — Space (port : withContainer(Space vue-ui) + behavior d'ère).
import { createBehavior, createResource } from '@formivue-design/core'
import type { DnFC } from '@formivue-design/vue'
import { Space as DSpace } from '@formivue-design/vue-ui'
import { withContainer } from '../../common/Container'
import { createVoidFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

export const Space: DnFC<any> = withContainer(DSpace) as any

Space.Behavior = createBehavior({
  name: 'Space',
  extends: ['Field'],
  selector: (node) => node.props['x-component'] === 'Space',
  designerProps: {
    droppable: true,
    propsSchema: createVoidFieldSchema(AllSchemas.Space),
  },
  designerLocales: AllLocales.Space,
})

Space.Resource = createResource({
  icon: 'SpaceSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        type: 'void',
        'x-component': 'Space',
      },
    },
  ],
})
