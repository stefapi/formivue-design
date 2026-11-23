import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  type PropType,
} from 'vue'
import { TreeNode } from '@formivue-design/core'
import { Rect } from '@formivue-design/shared'
import { reaction } from '@formivue/reactive'
import { usePrefix, useViewport } from '../../hooks'
import { Selector } from './Selector'
import { Copy } from './Copy'
import { Delete } from './Delete'
import { DragHandler } from './DragHandler'
import cls from 'classnames'

const HELPER_DEBOUNCE_TIMEOUT = 100

export interface IHelpersProps {
  node: TreeNode
  nodeRect: Rect
}

export interface IViewportState {
  viewportWidth?: number
  viewportHeight?: number
  viewportScrollX?: number
  viewportScrollY?: number
  viewportIsScrollTop?: boolean
  viewportIsScrollBottom?: boolean
}

export const Helpers = defineComponent({
  name: 'Helpers',
  props: {
    node: { type: Object as PropType<TreeNode>, required: true },
    nodeRect: { type: Object as PropType<Rect>, required: true },
  },
  setup(props) {
    const prefix = usePrefix('aux-helpers')
    const viewport = useViewport()
    const unmountRef = ref(false)
    const helpersRef = ref<HTMLDivElement>(null)
    const position = ref('top-right')

    onMounted(() => {
      let request: any = null

      const getYInViewport = (nodeRect: Rect, helpersRect: Rect) => {
        if (nodeRect.top - viewport.scrollY > helpersRect.height) {
          return 'top'
        } else if (
          viewport.isScrollTop &&
          nodeRect.height + helpersRect.height > viewport.height
        ) {
          return 'inner-top'
        } else if (
          nodeRect.bottom >= viewport.scrollY + viewport.height &&
          nodeRect.height + helpersRect.height > viewport.height
        ) {
          return 'inner-bottom'
        }
        return 'bottom'
      }

      const getXInViewport = (nodeRect: Rect, helpersRect: Rect) => {
        const widthDelta = helpersRect.width - nodeRect.width
        if (widthDelta >= 0) {
          if (nodeRect.x < widthDelta) {
            return 'left'
          } else if (nodeRect.right + widthDelta > viewport.width) {
            return 'right'
          } else {
            return 'center'
          }
        }
        return 'right'
      }

      const update = () => {
        const helpersRect = helpersRef.value?.getBoundingClientRect()
        if (!helpersRect || !props.nodeRect) return
        if (unmountRef.value) return
        position.value =
          getYInViewport(props.nodeRect, helpersRect as any) +
          '-' +
          getXInViewport(props.nodeRect, helpersRect as any)
      }

      update()

      const disposer = reaction(
        () => [
          viewport.width,
          viewport.height,
          viewport.scrollX,
          viewport.scrollY,
          viewport.isScrollBottom,
          viewport.isScrollTop,
        ],
        () => {
          clearTimeout(request)
          request = setTimeout(update, HELPER_DEBOUNCE_TIMEOUT)
        },
      )
      onBeforeUnmount(() => {
        unmountRef.value = true
        clearTimeout(request)
        disposer()
      })
    })

    return () => {
      if (!props.nodeRect || !props.node) return null
      // structure d'ère (AuxToolWidget/styles.less) : helpers absolus,
      // pointer-events all ; le positionnement par direction (bottom-right,
      // top-center…) est la grille d'utilitaires d'ère.
      const directionClass: Record<string, string> = {
        'bottom-right': 'top-full right-0',
        'bottom-left': 'top-full left-0',
        'bottom-center': 'top-full left-1/2 -translate-x-1/2',
        'inner-top-right': '-top-0.5 right-0.5',
        'inner-top-left': '-top-0.5 left-0.5',
        'inner-top-center': '-top-0.5 right-0.5',
        'inner-bottom-right': '-bottom-0.5 right-0.5',
        'inner-bottom-left': '-bottom-0.5 left-0.5',
        'inner-bottom-center': '-bottom-0.5 right-0.5',
        'top-right': 'bottom-full right-0',
        'top-left': 'bottom-full left-0',
        'top-center': 'bottom-full left-1/2 -translate-x-1/2',
      }
      return h(
        'div',
        {
          class: cls(
            prefix,
            'pointer-events-auto absolute z-10 select-none',
            directionClass[position.value],
            {
              [position.value]: true,
            },
          ),
          ref: helpersRef,
        },
        [
          h(
            'div',
            {
              class: cls(
                prefix + '-content',
                'flex flex-nowrap items-center gap-px whitespace-nowrap',
              ),
            },
            [
              h(Selector, { node: props.node }),
              props.node?.allowClone() === false
                ? null
                : h(Copy, { node: props.node }),
              props.node?.allowDrag() === false
                ? null
                : h(DragHandler, { node: props.node }),
              props.node?.allowDelete() === false
                ? null
                : h(Delete, { node: props.node }),
            ],
          ),
        ],
      )
    }
  },
})
