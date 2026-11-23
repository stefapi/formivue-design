import { defineComponent, h } from 'vue'
import { useMoveHelper, usePrefix } from '../../hooks'
import { ClosestPosition } from '@formivue-design/core'
import { observer } from '@formivue/reactive-vue'

// Indicateur d'insertion du canvas — géométrie inline d'ère conservée à
// l'identique, la couleur passe en classe utilitaire (V6).
export const Insertion = observer(
  defineComponent({
    name: 'AuxInsertion',
    setup() {
      const moveHelper = useMoveHelper()
      const prefix = usePrefix('aux-insertion')
      const createInsertionStyle = (): any => {
        const closestDirection = moveHelper?.viewportClosestDirection
        const closestRect = moveHelper?.viewportClosestOffsetRect
        const isInlineLayout =
          moveHelper?.closestNode?.moveLayout === 'horizontal'
        const baseStyle: any = {
          position: 'absolute',
          transform: 'perspective(1px) translate3d(0,0,0)',
          top: 0,
          left: 0,
        }
        if (!closestRect) return baseStyle
        if (
          closestDirection === ClosestPosition.Before ||
          closestDirection === ClosestPosition.ForbidBefore
        ) {
          baseStyle.width = '2px'
          baseStyle.height = closestRect.height + 'px'
          baseStyle.transform = `perspective(1px) translate3d(${closestRect.x}px,${closestRect.y}px,0)`
        } else if (
          closestDirection === ClosestPosition.After ||
          closestDirection === ClosestPosition.ForbidAfter
        ) {
          baseStyle.width = '2px'
          baseStyle.height = closestRect.height + 'px'
          baseStyle.transform = `perspective(1px) translate3d(${
            closestRect.x + closestRect.width - 2
          }px,${closestRect.y}px,0)`
        } else if (
          closestDirection === ClosestPosition.InnerAfter ||
          closestDirection === ClosestPosition.Under ||
          closestDirection === ClosestPosition.ForbidInnerAfter ||
          closestDirection === ClosestPosition.ForbidUnder
        ) {
          if (isInlineLayout) {
            baseStyle.width = '2px'
            baseStyle.height = closestRect.height + 'px'
            baseStyle.transform = `perspective(1px) translate3d(${
              closestRect.x + closestRect.width - 2
            }px,${closestRect.y}px,0)`
          } else {
            baseStyle.width = closestRect.width + 'px'
            baseStyle.height = '2px'
            baseStyle.transform = `perspective(1px) translate3d(${
              closestRect.x
            }px,${closestRect.y + closestRect.height - 2}px,0)`
          }
        } else if (
          closestDirection === ClosestPosition.InnerBefore ||
          closestDirection === ClosestPosition.Upper ||
          closestDirection === ClosestPosition.ForbidInnerBefore ||
          closestDirection === ClosestPosition.ForbidUpper
        ) {
          if (isInlineLayout) {
            baseStyle.width = '2px'
            baseStyle.height = closestRect.height + 'px'
            baseStyle.transform = `perspective(1px) translate3d(${closestRect.x}px,${closestRect.y}px,0)`
          } else {
            baseStyle.width = closestRect.width + 'px'
            baseStyle.height = '2px'
            baseStyle.transform = `perspective(1px) translate3d(${closestRect.x}px,${closestRect.y}px,0)`
          }
        }
        if (String(closestDirection).includes('FORBID')) {
          baseStyle.backgroundColor = 'red'
        }
        return baseStyle
      }

      return () => {
        if (!moveHelper?.closestNode) return null
        return h('div', {
          class: prefix + ' bg-primary',
          style: createInsertionStyle(),
        })
      }
    },
  }),
)
