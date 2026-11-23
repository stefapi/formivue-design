import { defineComponent, Fragment, h, type PropType } from 'vue'
import { useDesigner, usePrefix } from '../../hooks'
import { TreeNode } from '@formivue-design/core'

export interface IResizeHandlerProps {
  node: TreeNode
}

export const ResizeHandler = defineComponent({
  name: 'ResizeHandler',
  props: {
    node: { type: Object as PropType<TreeNode>, required: true },
  },
  setup(props) {
    const designer = useDesigner()
    const prefix = usePrefix('aux-node-resize-handler')
    // structure d'ère (AuxToolWidget/styles.less) : poignées 10×10
    // absolues, cercle blanc bordé brand (token primary), cursor par
    // direction — les 8 variantes d'ère en utilitaires.
    const directionClass: Record<string, string> = {
      'left-center':
        '-translate-x-[calc(50%_+_1px)] -translate-y-1/2 cursor-ew-resize',
      'right-center':
        'translate-x-[calc(-50%_+_1px)] -translate-y-1/2 cursor-ew-resize',
      'center-top':
        '-translate-x-1/2 -translate-y-[calc(50%_+_1px)] cursor-ns-resize',
      'center-bottom':
        '-translate-x-1/2 translate-y-[calc(-50%_+_1px)] cursor-ns-resize',
      'left-top':
        'translate-x-[calc(-50%_+_1px)] translate-y-[calc(-50%_+_1px)] cursor-nwse-resize',
      'left-bottom': '-translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
      'right-bottom': '-translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
      'right-top': '-translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
    }
    const createHandler = (value: string) => {
      return {
        [designer?.props?.nodeResizeHandlerAttrName ||
        'data-designer-node-resize-handler']: value,
        class: `${prefix} ${directionClass[value]} ${value} pointer-events-auto absolute h-2.5 w-2.5 rounded-full border border-primary bg-background`,
      }
    }
    return () => {
      const allowResize = props.node.allowResize()
      if (!allowResize) return null
      const allowX = allowResize.includes('x')
      const allowY = allowResize.includes('y')
      return h(Fragment, [
        allowX && h('div', { ...createHandler('left-center') }),
        allowX && h('div', { ...createHandler('right-center') }),
        allowY && h('div', { ...createHandler('center-top') }),
        allowY && h('div', { ...createHandler('center-bottom') }),
        allowX && allowY && h('div', { ...createHandler('left-top') }),
        allowY && allowY && h('div', { ...createHandler('right-top') }),
        allowX && allowY && h('div', { ...createHandler('left-bottom') }),
        allowY && allowY && h('div', { ...createHandler('right-bottom') }),
      ])
    }
  },
})
