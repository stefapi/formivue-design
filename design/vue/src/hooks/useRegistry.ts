import { GlobalRegistry, IDesignerRegistry } from '@formivue-design/core'
import { globalThisPolyfill } from '@formivue-design/shared'

export const useRegistry = (): IDesignerRegistry => {
  return globalThisPolyfill['__DESIGNER_REGISTRY__'] || GlobalRegistry
}
