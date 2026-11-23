// formivue/vue — Radio (matériau d'ère : seul Radio.Group est exposé —
// écart V1 documenté : le radio isolé headless n'existe pas, `Radio` et
// `Radio.Group` résolvent le groupe vue-ui).
import type { Component } from 'vue'
import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import { Radio as DRadio } from '@formivue-design/vue-ui'
import { createBehavior, createResource } from '@formivue-design/core'
import type { DnFC } from '@formivue-design/vue'
import { PreviewText } from '../../preview-text'
import { createFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

export const Radio: DnFC<any> & { Group?: Component } = connect(
  DRadio,
  mapProps({ dataSource: 'options' } as any),
  mapReadPretty(PreviewText.Select as any),
) as any

Radio.Group = Radio

Radio.Behavior = createBehavior({
  name: 'Radio.Group',
  extends: ['Field'],
  selector: (node) => node.props['x-component'] === 'Radio.Group',
  designerProps: {
    propsSchema: createFieldSchema(AllSchemas.Radio.Group),
  },
  designerLocales: AllLocales.RadioGroup,
})

Radio.Resource = createResource({
  icon: 'RadioGroupSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        type: 'string | number',
        title: 'Radio Group',
        'x-decorator': 'FormItem',
        'x-component': 'Radio.Group',
        enum: [
          { label: 'Option 1', value: 1 },
          { label: 'Option 2', value: 2 },
        ],
      },
    },
  ],
})
