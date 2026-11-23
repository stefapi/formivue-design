import type { ComputedRef, InjectionKey } from 'vue'
import { TreeNode } from '@formivue-design/core'

export interface IOutlineNodeContext {
  renderTitle?: (node: TreeNode) => any
  renderActions?: (node: TreeNode) => any
}

// interne au widget (n'existe pas dans la baseline) — port de l'ère
// widgets/OutlineWidget/context.ts (createContext → InjectionKey). La valeur
// fournie est un ComputedRef (props réactives de OutlineTreeWidget).
export const NodeContext: InjectionKey<ComputedRef<IOutlineNodeContext>> =
  Symbol('OutlineNodeContext')
