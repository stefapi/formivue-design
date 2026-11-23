import { defineComponent, h, type PropType } from 'vue'
import { GlobalRegistry, TreeNode } from '@formivue-design/core'
import { usePrefix } from '../../hooks'
import { IconWidget } from '../IconWidget'
import { Button } from '@formivue-design/vue-ui'

export interface ICopyProps {
  node: TreeNode
  style?: any
}

export const Copy = defineComponent({
  name: 'Copy',
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
            TreeNode.clone([props.node])
          },
          'aria-label':
            GlobalRegistry.getDesignerMessage('tools.copyNode') || 'Copy node',
        } as any,
        { default: () => h(IconWidget, { infer: 'Clone' }) },
      )
    }
  },
})
