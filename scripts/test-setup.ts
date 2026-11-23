// Setup vitest global : matchers jest-dom (@testing-library) pour les suites de bindings.
import '@testing-library/jest-dom/vitest'

// reka-ui (registry, useDrawerVirtualKeyboard) requiert window.matchMedia,
// absent de jsdom — recette standard de test UI headless. Le polyfill était
// initialement celui d'antd@4 (phase v3) ; reka-ui en hérite depuis la phase 2.
// Guard : n'écrase pas une vraie implémentation.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false
      },
    }),
  })
}

// reka-ui (useSize : Slider, Popper…) requiert ResizeObserver, absent de jsdom
// (recette fork : stub local dans ses specs ; ici global pour tout le repo —
// le navigateur cible l'a natif, @formivue-design/core l'a derrière une garde SSR
// depuis 7.1). Guard : n'écrase pas une vraie implémentation.
if (typeof (globalThis as any).ResizeObserver === 'undefined') {
  ;(globalThis as any).ResizeObserver = class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// reka-ui (Select/Menu triggers) requiert l'API Pointer Capture, absente de
// jsdom (hasPointerCapture etc.) — recette standard des tests Radix/reka.
if (typeof Element !== 'undefined') {
  const proto = Element.prototype as any
  if (!proto.hasPointerCapture) {
    proto.hasPointerCapture = function hasPointerCapture() {
      return false
    }
    proto.setPointerCapture = function setPointerCapture() {}
    proto.releasePointerCapture = function releasePointerCapture() {}
    proto.scrollIntoView = proto.scrollIntoView ?? function scrollIntoView() {}
  }
}

// @formivue-design/core (Viewport.isPointInViewport, drivers souris) requiert
// document.elementFromPoint, absent de jsdom — les specs driver du studio
// (phase 3.6) dispatchent des événements synthétiques qui l'atteignent.
if (typeof document !== 'undefined' && !document.elementFromPoint) {
  ;(document as any).elementFromPoint = function elementFromPoint() {
    return document.body ?? null
  }
}

// ---------------------------------------------------------------------------
// Shims hérités de l'intégration formivue v3 (fork global.config.ts) — les
// suites manager/* consomment les mêmes setupFiles que le fork avait en racine.
// ---------------------------------------------------------------------------

// global.sleep utilisé par les specs @formivue/{core,reactive} (attentes asynchrones)
;(global as any).sleep = (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time))
}

// jsdom n'implémente pas requestAnimationFrame (utilisé par @formivue/grid)
// @ts-expect-error contexte jsdom — ignoré hors DOM
if (!globalThis.requestAnimationFrame) {
  // @ts-expect-error contexte jsdom (grid tests) — ignoré hors DOM
  globalThis.requestAnimationFrame = (fn: () => void) => setTimeout(fn, 0)
}
