// formivue/vue — TreeSelect (matériau d'ère, V3 backlog levé : TreeSelect maison
// vue-ui — options depuis field.dataSource (arbre label/value/children)).
import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import { TreeSelect as DTreeSelect } from '@formivue-design/vue-ui'
import { createBehavior, createResource } from '@formivue-design/core'
import type { DnFC } from '@formivue-design/vue'
import { PreviewText } from '../../preview-text'
import { createFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

export const TreeSelect: DnFC<any> = connect(
  DTreeSelect,
  mapProps({ dataSource: 'options' } as any),
  mapReadPretty(PreviewText.TreeSelect as any),
) as any

TreeSelect.Behavior = createBehavior({
  name: 'TreeSelect',
  extends: ['Field'],
  selector: (node) => node.props['x-component'] === 'TreeSelect',
  designerProps: {
    propsSchema: createFieldSchema(AllSchemas.TreeSelect),
  },
  designerLocales: AllLocales.TreeSelect,
})

TreeSelect.Resource = createResource({
  icon: 'TreeSelectSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        title: 'TreeSelect',
        'x-decorator': 'FormItem',
        'x-component': 'TreeSelect',
      },
    },
  ],
})
