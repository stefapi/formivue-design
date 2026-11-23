import { getCurrentInstance, inject } from 'vue'
import { TreeNodeContext } from '../context'

export const useTreeNode = () => {
  return getCurrentInstance() ? inject(TreeNodeContext, null) : undefined
}
