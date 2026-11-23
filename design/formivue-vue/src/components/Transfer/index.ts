// formivue/vue — Transfer (matériau d'ère, V3 backlog levé : Transfer maison
// vue-ui — valeurs de la liste cible, options depuis field.dataSource).
import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import { Transfer as DTransfer } from '@formivue-design/vue-ui'
import { createBehavior, createResource } from '@formivue-design/core'
import type { DnFC } from '@formivue-design/vue'
import { PreviewText } from '../../preview-text'
import { createFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

export const Transfer: DnFC<any> = connect(
  DTransfer,
  mapProps({ dataSource: 'options' } as any),
  mapReadPretty(PreviewText.Transfer as any),
) as any

Transfer.Behavior = createBehavior({
  name: 'Transfer',
  extends: ['Field'],
  selector: (node) => node.props['x-component'] === 'Transfer',
  designerProps: {
    propsSchema: createFieldSchema(AllSchemas.Transfer),
  },
  designerLocales: AllLocales.Transfer,
})

Transfer.Resource = createResource({
  icon: 'TransferSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        title: 'Transfer',
        'x-decorator': 'FormItem',
        'x-component': 'Transfer',
      },
    },
  ],
})
