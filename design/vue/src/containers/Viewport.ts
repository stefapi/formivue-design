import {
  defineComponent,
  h,
  isVNode,
  onBeforeUnmount,
  onMounted,
  ref,
  type PropType,
} from 'vue'
import { usePrefix, useViewport } from '../hooks'
import { AuxToolWidget, EmptyWidget } from '../widgets'
import { Viewport as ViewportType } from '@formivue-design/core'
import { requestIdle, globalThisPolyfill } from '@formivue-design/shared'
import cls from 'classnames'

export interface IViewportProps {
  placeholder?: any
  dragTipsDirection?: 'left' | 'right'
}

export const Viewport = defineComponent({
  name: 'Viewport',
  inheritAttrs: false,
  props: {
    placeholder: { type: null, default: undefined },
    dragTipsDirection: {
      type: String as PropType<'left' | 'right'>,
      default: undefined,
    },
  },
  setup(props, { slots, attrs }) {
    const loaded = ref(false)
    const prefix = usePrefix('viewport')
    const viewport = useViewport()
    const viewportRef = ref<ViewportType>(null)
    const isFrame = ref(false)
    const rootRef = ref<HTMLDivElement>(null)

    onMounted(() => {
      const frameElement = rootRef.value?.querySelector('iframe')
      if (!viewport) return
      if (viewportRef.value && viewportRef.value !== viewport) {
        viewportRef.value.onUnmount()
      }
      if (frameElement) {
        frameElement.addEventListener('load', () => {
          viewport.onMount(frameElement, (frameElement as any).contentWindow)
          requestIdle(() => {
            isFrame.value = true
            loaded.value = true
          })
        })
      } else {
        viewport.onMount(rootRef.value, globalThisPolyfill as any)
        requestIdle(() => {
          isFrame.value = false
          loaded.value = true
        })
      }
      viewportRef.value = viewport
    })
    onBeforeUnmount(() => {
      viewport?.onUnmount()
    })

    return () =>
      h(
        'div',
        {
          ...attrs,
          ref: rootRef,
          class: cls(
            prefix,
            'relative h-full min-h-[100px] w-full box-border select-none outline-none overflow-y-auto',
            (attrs as any).class,
          ),
          style: {
            opacity: !loaded.value ? 0 : 1,
            overflow: isFrame.value ? 'hidden' : 'overlay',
            ...((attrs as any).style || {}),
          },
        },
        [
          slots.default?.(),
          h(AuxToolWidget),
          h(
            EmptyWidget,
            { dragTipsDirection: props.dragTipsDirection || 'left' },
            {
              default: () =>
                slots.placeholder
                  ? slots.placeholder()
                  : isVNode(props.placeholder)
                    ? props.placeholder
                    : undefined,
            },
          ),
        ],
      )
  },
})
