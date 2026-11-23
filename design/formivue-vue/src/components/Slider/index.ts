import { isVNode } from 'vue'
import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import { Slider as DSlider } from '@formivue-design/vue-ui'
import { createBehavior, createResource } from '@formivue-design/core'
import type { DnFC } from '@formivue-design/vue'
import { PreviewText } from '../../preview-text'
import { createFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { sliderNumberInputProps } from '../../schemas/Slider'
import { AllLocales } from '../../locales'

export const Slider: DnFC<any> = connect(
  DSlider,
  mapProps((props, field) => {
    const children = isVNode(field.title) ? field.title.children : field.title
    const title = Array.isArray(children) ? children[0] : children
    return {
      'aria-label':
        props['aria-label'] ?? (typeof title === 'string' ? title : undefined),
    }
  }),
  mapReadPretty(PreviewText as any),
) as any

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
