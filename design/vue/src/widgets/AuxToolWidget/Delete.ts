import { defineComponent, h, type PropType } from 'vue'
import { GlobalRegistry, TreeNode } from '@formivue-design/core'
import { IconWidget } from '../IconWidget'
import { usePrefix } from '../../hooks'
import { Button } from '@formivue-design/vue-ui'

export interface IDeleteProps {
  node: TreeNode
  style?: any
}

// note : l'ère réutilisait le préfixe 'aux-copy' ici (gardé à l'identique).
export const Delete = defineComponent({
  name: 'Delete',
  props: {
    node: { type: Object as PropType<TreeNode>, required: true },
  },
  setup(props, { attrs }) {
    const prefix = usePrefix('aux-copy')
    return () => {
      if (props.node === props.node.root) return null
      return h(
        Button,
        {
          ...attrs,
          class: prefix,
          type: 'primary',
          onClick: () => {
            TreeNode.remove([props.node])
          },
          'aria-label':
            GlobalRegistry.getDesignerMessage('tools.deleteNode') ||
            'Delete node',
        } as any,
        { default: () => h(IconWidget, { infer: 'Remove' }) },
      )
    }
  },
})
