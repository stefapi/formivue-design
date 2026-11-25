import { isVNode } from 'vue'
import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import { Slider as DSlider } from '@formivue-design/vue-ui'
import { PreviewText } from '../preview-text'

export const Slider = connect(
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
