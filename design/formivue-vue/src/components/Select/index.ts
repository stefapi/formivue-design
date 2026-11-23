// formivue/vue — Select (binding + matériau d'ère, props adaptées headless :
// `multiple` booléen remplace le `mode` antd, options depuis field.dataSource).
import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import { Select as DSelect } from '@formivue-design/vue-ui'
import { createBehavior, createResource } from '@formivue-design/core'
import type { DnFC } from '@formivue-design/vue'
import { PreviewText } from '../../preview-text'
import { createFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

export const Select: DnFC<any> = connect(
  DSelect,
  mapProps({ dataSource: 'options' } as any),
  mapReadPretty(PreviewText.Select as any),
) as any

Select.Behavior = createBehavior({
  name: 'Select',
  extends: ['Field'],
  selector: (node) => node.props['x-component'] === 'Select',
  designerProps: {
    propsSchema: createFieldSchema(AllSchemas.Select),
  },
  designerLocales: AllLocales.Select,
})

Select.Resource = createResource({
  icon: 'SelectSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        title: 'Select',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
      },
    },
  ],
})
