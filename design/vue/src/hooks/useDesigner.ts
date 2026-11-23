import { getCurrentInstance, inject, onBeforeUnmount, onMounted } from 'vue'
import { Engine } from '@formivue-design/core'
import { DesignerEngineContext } from '../context'
import { isFn, globalThisPolyfill } from '@formivue-design/shared'

export interface IEffects {
  (engine: Engine): void | (() => void)
}

export const useDesigner = (effects?: IEffects): Engine => {
  const designer: Engine =
    globalThisPolyfill['__FORMIVUEDESIGN_ENGINE__'] ||
    (getCurrentInstance() ? inject(DesignerEngineContext, null) : undefined)

  if (getCurrentInstance()) {
    let dispose: () => void = null
    onMounted(() => {
      if (isFn(effects)) {
        dispose = effects(designer) as (() => void) | null
      }
    })
    onBeforeUnmount(() => {
      if (isFn(dispose)) dispose()
    })
  }
  return designer
}
