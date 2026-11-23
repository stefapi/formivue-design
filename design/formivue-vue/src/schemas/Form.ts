import type { ISchema } from '@formivue/json-schema'
import { FormLayout } from './FormLayout'
import { CSSStyle } from './CSSStyle'

export const Form: ISchema = {
  type: 'object',
  properties: {
    ...FormLayout.properties,
    layout: {
      ...FormLayout.properties.layout,
      'x-component-props': { defaultValue: 'vertical' },
    },
    style: CSSStyle,
  },
}
