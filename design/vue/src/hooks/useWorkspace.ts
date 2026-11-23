import { getCurrentInstance, inject } from 'vue'
import { useDesigner } from './useDesigner'
import { WorkspaceContext } from '../context'
import { Workspace } from '@formivue-design/core'
import { globalThisPolyfill } from '@formivue-design/shared'

export const useWorkspace = (id?: string): Workspace => {
  const designer = useDesigner()
  const workspaceId =
    id || (getCurrentInstance() ? inject(WorkspaceContext, null)?.id : null)
  if (workspaceId) {
    return designer?.workbench?.findWorkspaceById(workspaceId)
  }
  if (globalThisPolyfill['__FORMIVUEDESIGN_WORKSPACE__'])
    return globalThisPolyfill['__FORMIVUEDESIGN_WORKSPACE__']
  return designer?.workbench?.currentWorkspace
}
