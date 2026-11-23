// formivue/vue — useDropTemplate (port verbatim de l'ère — la logique vit dans
// le moteur, seul le canal du hook change : composable Vue appelé au setup,
// effets au mount + cleanup à la destruction, contrat useDesigner d'ère).
import { AppendNodeEvent, TreeNode } from '@formivue-design/core'
import { useDesigner } from '@formivue-design/vue'
import { matchComponent, matchChildComponent } from '../shared'

export const useDropTemplate = (
  name: string,
  getChildren: (source: TreeNode[]) => TreeNode[],
) => {
  return useDesigner((designer) => {
    return designer.subscribeTo(AppendNodeEvent, (event) => {
      const { source, target } = event.data
      if (Array.isArray(target)) return
      if (!Array.isArray(source)) return
      if (
        matchComponent(
          target,
          (key) =>
            key === name &&
            source.every((child) => !matchChildComponent(child, name)),
        ) &&
        target.children.length === 0
      ) {
        target.setChildren(...getChildren(source))
        return false
      }
    })
  })
}
