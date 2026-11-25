import { Materials } from '@formivue-design/formivue-runtime'
import { cloneBinding } from '../../common/runtime'
import { createBehavior, createResource } from '@formivue-design/core'
import type { DnFC } from '@formivue-design/vue'
import { createFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { sliderNumberInputProps } from '../../schemas/Slider'
import { AllLocales } from '../../locales'

export const Slider: DnFC<any> = cloneBinding(Materials.Slider) as DnFC<any>

Slider.Behavior = createBehavior({
  name: 'Slider',
  extends: ['Field'],
  selector: (node) => node.props['x-component'] === 'Slider',
  designerProps: {
    propsSchema: createFieldSchema(AllSchemas.Slider, AllSchemas.FormItem, {
      ...sliderNumberInputProps,
      include: ['NUMBER', 'EXPRESSION'],
    }),
  },
  designerLocales: AllLocales.Slider,
})

Slider.Resource = createResource({
  icon: 'SliderSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        type: 'number',
        title: 'Slider',
        'x-decorator': 'FormItem',
        'x-component': 'Slider',
      },
    },
  ],
})
