// formivue/vue — Cascader (matériau d'ère, V3 backlog levé : Cascader maison
// vue-ui — chemin de valeurs, options en arbre depuis field.dataSource).
import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import { Cascader as DCascader } from '@formivue-design/vue-ui'
import { createBehavior, createResource } from '@formivue-design/core'
import type { DnFC } from '@formivue-design/vue'
import { PreviewText } from '../../preview-text'
import { createFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

export const Cascader: DnFC<any> = connect(
  DCascader,
  mapProps({ dataSource: 'options' } as any),
  mapReadPretty(PreviewText.Cascader as any),
) as any

Cascader.Behavior = createBehavior({
  name: 'Cascader',
  extends: ['Field'],
  selector: (node) => node.props['x-component'] === 'Cascader',
  designerProps: {
    propsSchema: createFieldSchema(AllSchemas.Cascader),
  },
  designerLocales: AllLocales.Cascader,
})

Cascader.Resource = createResource({
  icon: 'CascaderSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        title: 'Cascader',
        'x-decorator': 'FormItem',
        'x-component': 'Cascader',
      },
    },
  ],
})
