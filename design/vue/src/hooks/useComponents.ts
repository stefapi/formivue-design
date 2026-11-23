import { getCurrentInstance, inject } from 'vue'
import { DesignerComponentsContext } from '../context'

export const useComponents = () =>
  getCurrentInstance()
    ? inject(DesignerComponentsContext, {} as any)
    : undefined
