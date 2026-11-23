import { onBeforeUnmount, shallowRef, watchEffect } from 'vue'
import { autorun, reaction } from '@formivue/reactive'
import { TreeNode, CursorStatus, CursorDragType } from '@formivue-design/core'
import { LayoutObserver, IRect, isFn } from '@formivue-design/shared'
import { useViewport } from './useViewport'
import { useDesigner } from './useDesigner'

const isEqualRect = (rect1: IRect, rect2: IRect) => {
  return (
    rect1?.x === rect2?.x &&
    rect1?.y === rect2?.y &&
    rect1?.width === rect2?.width &&
    rect1?.height === rect2?.height
  )
}

// Port du hook d'ère (useState+forceUpdate → shallowRef) : le rect initial est
// mesuré au bind, puis rafraîchi par LayoutObserver (resize/paint/mutation).
// Le paramètre accepte un getter en plus du TreeNode nu : l'ère relisait le
// node à chaque render React, Vue n'exécute setup qu'une fois — le getter
// restitue la ré-observation (consommateurs non keyés, ex. DashedBox).
// Ré-observation double-canale : watchEffect (getters réactifs Vue) +
// autorun (observables formivue, ex. hover.node) — rebind idempotent.
export const useValidNodeOffsetRect = (node?: TreeNode | (() => TreeNode)) => {
  const engine = useDesigner()
  const viewport = useViewport()
  const getNode = () => (isFn(node) ? (node as any)() : node)
  const rectRef = shallowRef<IRect>(viewport?.getValidNodeOffsetRect(getNode()))

  let layoutObserver: LayoutObserver = null
  let lastElement: HTMLElement = null
  let retryFrame: number = null
  let retries = 0
  let disposed = false

  const compute = () => {
    // l'élément observé a été remplacé (re-render du composant) : rebind
    if (lastElement && !lastElement.isConnected) return rebind()
    if (
      engine?.cursor?.status !== CursorStatus.Normal &&
      engine?.cursor?.dragType === CursorDragType.Move
    )
      return
    const nextRect = viewport?.getValidNodeOffsetRect(getNode())
    if (!isEqualRect(rectRef.value, nextRect) && nextRect) {
      rectRef.value = nextRect
    }
  }

  // L'ère re-calculait `element` à chaque render React du parent ; en Vue le
  // setup ne s'exécute qu'une fois et findElementById n'est pas réactif. Un
  // node tout juste créé (drop) est sélectionné avant que son élément soit
  // monté : on retente sur les frames suivantes jusqu'à le trouver.
  const scheduleRetry = () => {
    if (disposed || retryFrame !== null || retries > 120) return
    retries++
    retryFrame = requestAnimationFrame(() => {
      retryFrame = null
      rebind()
    })
  }

  function rebind() {
    const target = getNode()
    const element = viewport?.findElementById(target?.id) as HTMLElement
    if (!element || !element.isConnected) {
      if (target) scheduleRetry()
      if (element === lastElement) return
    } else {
      retries = 0
    }
    if (element === lastElement) return
    lastElement = element
    layoutObserver?.disconnect()
    layoutObserver = new LayoutObserver(compute)
    if (element) {
      layoutObserver.observe(element)
      compute()
    }
  }

  watchEffect(rebind)
  const disposeAutorun = autorun(rebind)
  // compute() est ignoré pendant un drag de déplacement ; l'ère re-rendait au
  // retour du curseur à Normal (observer React) — on re-mesure explicitement,
  // sinon un node déposé/déplacé garde un rect vide ou périmé.
  const disposeCursor = reaction(
    () => engine?.cursor?.status,
    () => compute(),
  )
  onBeforeUnmount(() => {
    disposeCursor()
    disposed = true
    if (retryFrame !== null) cancelAnimationFrame(retryFrame)
    disposeAutorun()
    layoutObserver?.disconnect()
  })
  return rectRef
}
