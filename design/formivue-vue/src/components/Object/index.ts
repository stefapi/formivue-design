// formivue/vue — Object/ObjectContainer (port de l'ère : Container nu sur le
// type object — pas de schema dédié, idem ère).
import { createBehavior, createResource } from '@formivue-design/core'
import type { DnFC } from '@formivue-design/vue'
import { Container } from '../../common/Container'
import { createFieldSchema } from '../Field'
import { AllLocales } from '../../locales'

export const ObjectContainer: DnFC<any> = Container as any

ObjectContainer.Behavior = createBehavior({
  name: 'Object',
  extends: ['Field'],
  selector: (node) => node.props.type === 'object',
  designerProps: {
    droppable: true,
    propsSchema: createFieldSchema(),
  },
  designerLocales: AllLocales.ObjectLocale,
})

ObjectContainer.Resource = createResource({
  icon: 'ObjectSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        type: 'object',
      },
    },
  ],
})
