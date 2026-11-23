import cls from 'classnames'
import { defineComponent, h, onBeforeUnmount, onMounted, ref } from 'vue'
import { useViewport, useDesigner, usePrefix } from '../../hooks'
import { Insertion } from './Insertion'
import { Selection } from './Selection'
import { FreeSelection } from './FreeSelection'
import { Cover } from './Cover'
import { DashedBox } from './DashedBox'
import { SpaceBlock } from './SpaceBlock'
import { SnapLine } from './SnapLine'

export const AuxToolWidget = defineComponent({
  name: 'AuxToolWidget',
  setup() {
    const engine = useDesigner()
    const viewport = useViewport()
    const prefix = usePrefix('auxtool')
    const auxRef = ref<HTMLDivElement>(null)
    let unSubscribe: () => void = null
    onMounted(() => {
      unSubscribe = engine?.subscribeWith('viewport:scroll', () => {
        if (viewport?.isIframe && auxRef.value) {
          auxRef.value.style.transform = `perspective(1px) translate3d(${-viewport.scrollX}px,${-viewport.scrollY}px,0)`
        }
      })
    })
    onBeforeUnmount(() => unSubscribe?.())

    return () => {
      if (!viewport) return null
      // structure d'ère : overlay absoulu plein viewport, pointer-events none
      return h(
        'div',
        {
          ref: auxRef,
          class: cls(
            prefix,
            'absolute left-0 top-0 z-[9998] h-full w-full pointer-events-none',
          ),
        },
        [
          h(Insertion),
          h(SpaceBlock),
          h(SnapLine),
          h(DashedBox),
          h(Selection),
          h(Cover),
          h(FreeSelection),
        ],
      )
    }
  },
})
