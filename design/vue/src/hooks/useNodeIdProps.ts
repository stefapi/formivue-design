import { TreeNode } from '@formivue-design/core'
import { useDesigner } from './useDesigner'
import { useTreeNode } from './useTreeNode'

export const useNodeIdProps = (node?: TreeNode) => {
  const target = useTreeNode()
  const designer = useDesigner()
  return {
    [designer?.props?.nodeIdAttrName || 'data-designer-node-id']: node
      ? node.id
      : target?.id,
  }
}
