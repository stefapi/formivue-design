import cls from 'classnames'
import { defineComponent, Fragment, h } from 'vue'
import { useTransformHelper, useCursor, usePrefix } from '../../hooks'
import { observer } from '@formivue/reactive-vue'
import { CursorStatus } from '@formivue-design/core'
import { IRect } from '@formivue-design/shared'

export const SnapLine = observer(
  defineComponent({
    name: 'SnapLine',
    setup() {
      const cursor = useCursor()
      const transformHelper = useTransformHelper()
      const prefix = usePrefix('aux-snap-line')
      const createLineStyle = (rect: IRect) => {
        const baseStyle: any = {
          top: 0,
          left: 0,
          height: (rect.height || 1) + 'px',
          width: (rect.width || 1) + 'px',
          transform: `perspective(1px) translate3d(${rect.x}px,${rect.y}px,0)`,
          background: `#b0b1f3`,
          position: 'absolute',
          zIndex: 2,
        }
        return baseStyle
      }
      return () => {
        if (cursor?.status !== CursorStatus.Dragging) return null
        return h(
          Fragment,
          (transformHelper?.closestSnapLines || []).map((line, key) => {
            if (line.type !== 'normal') return null
            return h('div', {
              key,
              // d'ère : ligne d'aimantation (barre brand)
              class: cls(prefix, 'bg-primary'),
              style: createLineStyle((line as any).rect),
            })
          }),
        )
      }
    },
  }),
)
