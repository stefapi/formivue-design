import { defineComponent, Fragment, h } from 'vue'
import cls from 'classnames'
import { useTransformHelper, useCursor, usePrefix } from '../../hooks'
import { observer } from '@formivue/reactive-vue'
import { CursorStatus } from '@formivue-design/core'
import {
  ILineSegment,
  calcRectOfAxisLineSegment,
} from '@formivue-design/shared'

export const SpaceBlock = observer(
  defineComponent({
    name: 'SpaceBlock',
    setup() {
      const cursor = useCursor()
      const transformHelper = useTransformHelper()
      const prefix = usePrefix('aux-space-block')

      const renderRulerBox = (distance: number, type: string) => {
        // structure d'ère (AuxToolWidget/styles.less) en utilitaires (V6) :
        // règles absolues + ligne médiane ::after, indicateur arrondi
        if (type === 'top' || type === 'bottom') {
          return h(
            'div',
            {
              class: cls(
                prefix + '-ruler-v',
                'absolute left-1/2 top-0 h-full w-3 -translate-x-1/2 border-b border-t border-primary',
                "after:absolute after:left-1/2 after:top-0 after:h-full after:w-px after:-translate-x-1/2 after:bg-primary after:content-['']",
              ),
            },
            [
              h(
                'div',
                {
                  class: cls(
                    prefix + '-ruler-indicator',
                    'absolute left-1/2 top-1/2 z-[2] flex -translate-x-1/2 -translate-y-1/2 scale-[0.7] items-center justify-center rounded-lg bg-primary text-primary-foreground',
                  ),
                },
                [
                  h('span', { class: 'inline-block px-1.5 text-xs' }, [
                    distance?.toFixed(0),
                  ]),
                ],
              ),
            ],
          )
        } else if (type === 'left' || type === 'right') {
          return h(
            'div',
            {
              class: cls(
                prefix + '-ruler-h',
                'absolute left-0 top-1/2 h-3 w-full -translate-y-1/2 border-l border-r border-primary',
                "after:absolute after:left-0 after:right-0 after:top-1/2 after:h-px after:-translate-y-1/2 after:bg-primary after:content-['']",
              ),
            },
            [
              h(
                'div',
                {
                  class: cls(
                    prefix + '-ruler-indicator',
                    'absolute left-1/2 top-1/2 z-[2] flex -translate-x-1/2 -translate-y-1/2 scale-[0.7] items-center justify-center rounded-lg bg-primary text-primary-foreground',
                  ),
                },
                [
                  h('span', { class: 'inline-block px-1.5 text-xs' }, [
                    distance?.toFixed(0),
                  ]),
                ],
              ),
            ],
          )
        }
      }

      const renderDashedLine = (line: ILineSegment) => {
        const rect = calcRectOfAxisLineSegment(line)
        if (!rect) return null
        const width = rect.width || 2
        const height = rect.height || 2
        return h(
          'svg',
          {
            width: width + 'px',
            height: height + 'px',
            viewBox: `0 0 ${width} ${height}`,
            style: {
              top: 0,
              left: 0,
              transform: `perspective(1px) translate3d(${line.start.x}px,${line.start.y}px,0)`,
              position: 'absolute',
              zIndex: 3,
            },
          },
          [
            h('line', {
              x1: line.start.x - rect.x,
              y1: line.start.y - rect.y,
              x2: line.end.x - rect.x,
              y2: line.end.y - rect.y,
              strokeDasharray: 4,
              stroke: '#745BFF',
              strokeWidth: 2,
            }),
          ],
        )
      }

      return () => {
        if (cursor?.status !== CursorStatus.Dragging) return null
        return h(Fragment, [
          ...(transformHelper?.measurerSpaceBlocks || []).map(
            ({ type, crossDragNodesRect, distance, extendsLine }: any) => {
              return h(Fragment, { key: type + distance }, [
                renderDashedLine(extendsLine),
                h(
                  'div',
                  {
                    style: {
                      top: 0,
                      left: 0,
                      height: crossDragNodesRect.height + 'px',
                      width: crossDragNodesRect.width + 'px',
                      transform: `perspective(1px) translate3d(${crossDragNodesRect.x}px,${crossDragNodesRect.y}px,0)`,
                      position: 'absolute',
                      zIndex: 3,
                    },
                  },
                  [renderRulerBox(distance, type)],
                ),
              ])
            },
          ),
          ...(transformHelper?.thresholdSpaceBlocks || []).map(
            ({ rect }: any) => {
              return h('div', {
                key: rect.x + '-' + rect.y,
                class: prefix,
                style: {
                  top: 0,
                  left: 0,
                  height: rect.height + 'px',
                  width: rect.width + 'px',
                  transform: `perspective(1px) translate3d(${rect.x}px,${rect.y}px,0)`,
                  position: 'absolute',
                  background: 'rgba(255, 0, 0, 0.2)',
                  zIndex: 1,
                },
              })
            },
          ),
        ])
      }
    },
  }),
)
