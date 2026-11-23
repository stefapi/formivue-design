import cls from 'classnames'
import { defineComponent, h } from 'vue'
import { useMoveHelper, usePrefix } from '../../hooks'
import { ClosestPosition } from '@formivue-design/core'
import { observer } from '@formivue/reactive-vue'

export interface IInsertionProps {
  workspaceId?: string
}

export const Insertion = observer(
  defineComponent({
    name: 'OutlineInsertion',
    props: {
      workspaceId: { type: String, default: undefined },
    },
    setup(props) {
      const moveHelper = useMoveHelper(props.workspaceId)
      const prefix = usePrefix('outline-tree-insertion')
      const createInsertionStyle = (): any => {
        const closestDirection = moveHelper?.outlineClosestDirection
        const closestRect = moveHelper?.outlineClosestOffsetRect
        const baseStyle: any = {
          position: 'absolute',
          transform: 'perspective(1px) translate3d(0,0,0)',
          top: 0,
          left: 0,
        }
        if (!closestRect) return baseStyle
        if (
          closestDirection === ClosestPosition.After ||
          closestDirection === ClosestPosition.InnerAfter ||
          closestDirection === ClosestPosition.Under ||
          closestDirection === ClosestPosition.ForbidAfter ||
          closestDirection === ClosestPosition.ForbidInnerAfter ||
          closestDirection === ClosestPosition.ForbidUnder
        ) {
          baseStyle.width = closestRect.width + 'px'
          baseStyle.height = '2px'
          baseStyle.transform = `perspective(1px) translate3d(${
            closestRect.x
          }px,${closestRect.y + closestRect.height - 2}px,0)`
        } else if (
          closestDirection === ClosestPosition.Before ||
          closestDirection === ClosestPosition.InnerBefore ||
          closestDirection === ClosestPosition.Upper ||
          closestDirection === ClosestPosition.ForbidBefore ||
          closestDirection === ClosestPosition.ForbidInnerBefore ||
          closestDirection === ClosestPosition.ForbidUpper
        ) {
          baseStyle.width = closestRect.width + 'px'
          baseStyle.height = '2px'
          baseStyle.transform = `perspective(1px) translate3d(${closestRect.x}px,${closestRect.y}px,0)`
        }
        if (String(closestDirection).includes('FORBID')) {
          baseStyle.backgroundColor = 'red'
        } else {
          baseStyle.backgroundColor = ''
        }
        return baseStyle
      }

      return () => {
        if (!moveHelper?.closestNode) return null
        return h('div', {
          // d'ère : marqueur d'insertion de l'arbre (barre brand)
          class: cls(prefix, 'bg-primary'),
          style: createInsertionStyle(),
        })
      }
    },
  }),
)
