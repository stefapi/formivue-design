import { defineComponent, h, ref, type Ref } from 'vue'
import { observer } from '@formivue/reactive-vue'
import {
  Engine,
  DragStartEvent,
  DragMoveEvent,
  DragStopEvent,
  CursorDragType,
} from '@formivue-design/core'
import {
  calcSpeedFactor,
  createUniformSpeedAnimation,
} from '@formivue-design/shared'
import { useScreen, useDesigner, usePrefix } from '../../hooks'
import { IconWidget } from '../../widgets'
import { ResizeHandle, ResizeHandleType } from './handle'

import cls from 'classnames'

const toPx = (v: number | string | undefined) =>
  typeof v === 'number' ? `${v}px` : v

const useResizeEffect = (
  container: Ref<HTMLDivElement>,
  content: Ref<HTMLDivElement>,
  engine: Engine,
) => {
  let status: ResizeHandleType = null
  let startX = 0
  let startY = 0
  let startWidth = 0
  let startHeight = 0
  let animationX = null
  let animationY = null

  const getStyle = (status: ResizeHandleType) => {
    if (status === ResizeHandleType.Resize) return 'nwse-resize'
    if (status === ResizeHandleType.ResizeHeight) return 'ns-resize'
    if (status === ResizeHandleType.ResizeWidth) return 'ew-resize'
  }

  const updateSize = (deltaX: number, deltaY: number) => {
    const containerRect = container.value?.getBoundingClientRect()
    if (status === ResizeHandleType.Resize) {
      engine.screen.setSize(startWidth + deltaX, startHeight + deltaY)
      container.value?.scrollBy(
        (containerRect as any).width + deltaX,
        (containerRect as any).height + deltaY,
      )
    } else if (status === ResizeHandleType.ResizeHeight) {
      engine.screen.setSize(startWidth, startHeight + deltaY)
      container.value?.scrollBy(
        container.value.scrollLeft,
        (containerRect as any).height + deltaY,
      )
    } else if (status === ResizeHandleType.ResizeWidth) {
      engine.screen.setSize(startWidth + deltaX, startHeight)
      container.value?.scrollBy(
        (containerRect as any).width + deltaX,
        container.value.scrollTop,
      )
    }
  }

  engine.subscribeTo(DragStartEvent, (e) => {
    if (!engine.workbench.currentWorkspace?.viewport) return
    const target = e.data.target as HTMLElement
    if (target?.closest(`*[${engine.props.screenResizeHandlerAttrName}]`)) {
      const rect = content.value?.getBoundingClientRect()
      if (!rect) return
      status = target.getAttribute(
        engine.props.screenResizeHandlerAttrName,
      ) as ResizeHandleType
      engine.cursor.setStyle(getStyle(status))
      startX = e.data.topClientX
      startY = e.data.topClientY
      startWidth = rect.width
      startHeight = rect.height
      engine.cursor.setDragType(CursorDragType.Resize)
    }
  })
  engine.subscribeTo(DragMoveEvent, (e) => {
    if (!engine.workbench.currentWorkspace?.viewport) return
    if (!status) return
    const deltaX = e.data.topClientX - startX
    const deltaY = e.data.topClientY - startY
    const containerRect = container.value?.getBoundingClientRect()
    const distanceX = Math.floor(
      (containerRect as any).right - e.data.topClientX,
    )
    const distanceY = Math.floor(
      (containerRect as any).bottom - e.data.topClientY,
    )
    const factorX = calcSpeedFactor(distanceX, 10)
    const factorY = calcSpeedFactor(distanceY, 10)
    updateSize(deltaX, deltaY)
    if (distanceX <= 10) {
      if (!animationX) {
        animationX = createUniformSpeedAnimation(1000 * factorX, (delta) => {
          updateSize(deltaX + delta, deltaY)
        })
      }
    } else {
      if (animationX) {
        animationX = animationX()
      }
    }

    if (distanceY <= 10) {
      if (!animationY) {
        animationY = createUniformSpeedAnimation(300 * factorY, (delta) => {
          updateSize(deltaX, deltaY + delta)
        })
      }
    } else {
      if (animationY) {
        animationY = animationY()
      }
    }
  })
  engine.subscribeTo(DragStopEvent, () => {
    if (!status) return
    status = null
    engine.cursor.setStyle('')
    engine.cursor.setDragType(CursorDragType.Move)
    if (animationX) {
      animationX = animationX()
    }
    if (animationY) {
      animationY = animationY()
    }
  })
}

export interface IResponsiveSimulatorProps {
  className?: string
  style?: any
}

export const ResponsiveSimulator = observer(
  defineComponent({
    name: 'ResponsiveSimulator',
    inheritAttrs: false,
    setup(_props, { slots, attrs }) {
      const container = ref<HTMLDivElement>(null)
      const content = ref<HTMLDivElement>(null)
      const prefix = usePrefix('responsive-simulator')
      const screen = useScreen()
      useDesigner((engine) => {
        useResizeEffect(container, content, engine)
      })
      return () =>
        h(
          'div',
          {
            ...attrs,
            // d'ère : fond simulateur distinct de l'écran (blanc) pour voir
            // les bords de la zone redimensionnée
            class: cls(prefix, 'bg-muted', (attrs as any).class),
            style: {
              height: '100%',
              width: '100%',
              minHeight: '100px',
              position: 'relative',
              ...((attrs as any).style || {}),
            },
          },
          [
            h(
              'div',
              {
                ref: container,
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: '100%',
                  overflow: 'overlay',
                },
              },
              [
                h(
                  'div',
                  {
                    ref: content,
                    class: 'bg-background shadow-sm',
                    style: {
                      width: toPx(screen?.width),
                      height: toPx(screen?.height),
                      paddingRight: '15px',
                      paddingBottom: '15px',
                      position: 'relative',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                    },
                  },
                  [
                    slots.default?.(),
                    h(
                      ResizeHandle,
                      { type: ResizeHandleType.Resize },
                      {
                        default: () =>
                          h(IconWidget, {
                            infer: 'DragMove',
                            style: { pointerEvents: 'none' },
                          }),
                      },
                    ),
                    h(
                      ResizeHandle,
                      { type: ResizeHandleType.ResizeHeight },
                      {
                        default: () =>
                          h(IconWidget, {
                            infer: 'Menu',
                            style: { pointerEvents: 'none' },
                          }),
                      },
                    ),
                    h(
                      ResizeHandle,
                      { type: ResizeHandleType.ResizeWidth },
                      {
                        default: () =>
                          h(IconWidget, {
                            infer: 'Menu',
                            style: { pointerEvents: 'none' },
                          }),
                      },
                    ),
                  ],
                ),
              ],
            ),
          ],
        )
    },
  }),
)
