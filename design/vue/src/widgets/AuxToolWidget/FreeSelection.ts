import { defineComponent, h } from 'vue'
import { useCursor, useViewport, useOperation, usePrefix } from '../../hooks'
import { observer } from '@formivue/reactive-vue'
import { CursorDragType, CursorStatus } from '@formivue-design/core'
import { calcRectByStartEndPoint } from '@formivue-design/shared'
import cls from 'classnames'

export const FreeSelection = observer(
  defineComponent({
    name: 'FreeSelection',
    setup() {
      const cursor = useCursor()
      const viewport = useViewport()
      const operation = useOperation()
      const prefix = usePrefix('aux-free-selection')
      const createSelectionStyle = () => {
        const startDragPoint = viewport.getOffsetPoint({
          x: cursor.dragStartPosition.topClientX,
          y: cursor.dragStartPosition.topClientY,
        })
        const currentPoint = viewport.getOffsetPoint({
          x: cursor.position.topClientX,
          y: cursor.position.topClientY,
        })
        const rect = calcRectByStartEndPoint(
          startDragPoint,
          currentPoint,
          viewport.dragScrollXDelta,
          viewport.dragScrollYDelta,
        )
        const baseStyle: any = {
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: 0.2,
          borderWidth: 1,
          borderStyle: 'solid',
          transform: `perspective(1px) translate3d(${rect.x}px,${rect.y}px,0)`,
          height: rect.height + 'px',
          width: rect.width + 'px',
          pointerEvents: 'none',
          boxSizing: 'border-box',
          zIndex: 1,
        }
        return baseStyle
      }

      return () => {
        if (
          operation?.moveHelper?.hasDragNodes ||
          cursor?.status !== CursorStatus.Dragging ||
          cursor?.dragType !== CursorDragType.Move
        )
          return null
        return h('div', {
          class: cls(prefix, 'border-primary bg-primary'),
          style: createSelectionStyle(),
        })
      }
    },
  }),
)
