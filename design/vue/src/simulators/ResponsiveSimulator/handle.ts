import { defineComponent, h } from 'vue'
import { useDesigner, usePrefix } from '../../hooks'
import cls from 'classnames'

export enum ResizeHandleType {
  Resize = 'RESIZE',
  ResizeWidth = 'RESIZE_WIDTH',
  ResizeHeight = 'RESIZE_HEIGHT',
}

export interface IResizeHandleProps {
  type?: ResizeHandleType
}

export const ResizeHandle = defineComponent({
  name: 'ResizeHandle',
  inheritAttrs: false,
  props: {
    type: { type: String as () => ResizeHandleType, default: undefined },
  },
  setup(props, { slots, attrs }) {
    const prefix = usePrefix('resize-handle')
    const designer = useDesigner()
    // structure d'ère (simulators/ResponsiveSimulator/styles.less) en
    // utilitaires (V6) — poignées absolues, 15px, cursor par type
    const typeClass: Record<string, string> = {
      RESIZE:
        'right-0 w-[15px] h-[15px] cursor-nwse-resize hover:bg-muted-foreground/20',
      RESIZE_WIDTH: 'top-0 bottom-[15px] right-0 w-[15px] cursor-ew-resize',
      RESIZE_HEIGHT: 'left-0 right-[15px] h-[15px] cursor-ns-resize',
    }
    return () =>
      h(
        'div',
        {
          ...attrs,
          ...{
            [designer?.props?.screenResizeHandlerAttrName ||
            'data-designer-screen-resize-handler']: props.type,
          },
          class: cls(
            prefix,
            'absolute bottom-0 z-10 flex items-center justify-center bg-muted text-muted-foreground select-none box-border transition-all duration-200 ease-in-out',
            props.type ? typeClass[props.type] : '',
            {
              [`${prefix}-${props.type}`]: !!props.type,
            },
          ),
        },
        slots.default?.(),
      )
  },
})
