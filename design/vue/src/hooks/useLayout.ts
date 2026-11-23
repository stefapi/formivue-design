import { getCurrentInstance, inject } from 'vue'
import { DesignerLayoutContext } from '../context'
import { IDesignerLayoutContext } from '../types'
import { globalThisPolyfill } from '@formivue-design/shared'

export const useLayout = (): IDesignerLayoutContext => {
  return (
    globalThisPolyfill['__FORMIVUEDESIGN_LAYOUT__'] ||
    (getCurrentInstance() ? inject(DesignerLayoutContext, null) : undefined)
  )
}
