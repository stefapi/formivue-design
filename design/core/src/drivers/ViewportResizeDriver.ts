import { EventDriver, globalThisPolyfill } from '@formivue-design/shared'
import { Engine } from '../models/Engine'
import { ViewportResizeEvent } from '../events'

export class ViewportResizeDriver extends EventDriver<Engine> {
  request = null

  resizeObserver: ResizeObserver = null

  onResize = (e: any) => {
    if (e.preventDefault) e.preventDefault()
    this.request = requestAnimationFrame(() => {
      cancelAnimationFrame(this.request)
      this.dispatch(
        new ViewportResizeEvent({
          scrollX: this.contentWindow.scrollX,
          scrollY: this.contentWindow.scrollY,
          width: this.contentWindow.innerWidth,
          height: this.contentWindow.innerHeight,
          innerHeight: this.contentWindow.innerHeight,
          innerWidth: this.contentWindow.innerWidth,
          view: this.contentWindow,
          target: e.target || this.container,
        }),
      )
    })
  }

  attach() {
    if (this.contentWindow && this.contentWindow !== globalThisPolyfill) {
      this.addEventListener('resize', this.onResize)
    } else {
      if (this.container && this.container !== document) {
        // Phase 7.1 : ResizeObserver natif derrière garde SSR (même fix que le
        // grid v3 du fork) — le polyfill @juggle/resize-observer d'ère est
        // retiré : absent de Node et de jsdom, natif dans tous les navigateurs
        // supportés (le comportement observe() initial est identique au
        // polyfill, lui-même fidèle à la spec).
        if (typeof ResizeObserver !== 'undefined') {
          this.resizeObserver = new ResizeObserver(this.onResize)
          this.resizeObserver.observe(this.container as HTMLElement)
        }
      }
    }
  }

  detach() {
    if (this.contentWindow && this.contentWindow !== globalThisPolyfill) {
      this.removeEventListener('resize', this.onResize)
    } else if (this.resizeObserver) {
      if (this.container && this.container !== document) {
        this.resizeObserver.unobserve(this.container as HTMLElement)
        this.resizeObserver.disconnect()
      }
    }
  }
}
