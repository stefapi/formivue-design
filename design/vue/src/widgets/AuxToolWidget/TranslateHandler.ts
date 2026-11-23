import { defineComponent, Fragment, h, type PropType } from 'vue'
import { useDesigner, usePrefix } from '../../hooks'
import { GlobalRegistry, TreeNode } from '@formivue-design/core'
import { IconWidget } from '../IconWidget'
import cls from 'classnames'

export interface ITranslateHandlerProps {
  node: TreeNode
}

export const TranslateHandler = defineComponent({
  name: 'TranslateHandler',
  props: {
    node: { type: Object as PropType<TreeNode>, required: true },
  },
  setup(props) {
    const designer = useDesigner()
    const prefix = usePrefix('aux-node-translate-handler')
    const createHandler = (value: string) => {
      return {
        [designer?.props?.nodeTranslateAttrName ||
        'data-designer-node-translate-handler']: value,
        // structure d'ère : pastille 40×20, absolute, primary translucide
        class: cls(
          prefix,
          'pointer-events-auto absolute flex h-5 w-10 items-center justify-center rounded-[2px] bg-primary/50 text-primary-foreground',
          value,
        ),
      }
    }
    return () => {
      const allowTranslate = props.node.allowTranslate()
      if (!allowTranslate) return null
      return h(Fragment, [
        h(
          'div',
          {
            ...createHandler('translate'),
            'aria-label':
              GlobalRegistry.getDesignerMessage('tools.translateNode') ||
              'Translate node',
          },
          [h(IconWidget, { infer: 'FreeMove' })],
        ),
      ])
    }
  },
})
