import {
  defineComponent,
  Fragment,
  h,
  onMounted,
  provide,
  type PropType,
} from 'vue'
import { useTree, useDesigner, useComponents, usePrefix } from '../../hooks'
import { TreeNodeContext, DesignerComponentsContext } from '../../context'
import { IDesignerComponents } from '../../types'
import { TreeNode, GlobalRegistry } from '@formivue-design/core'
import { observer } from '@formivue/reactive-vue'
import cls from 'classnames'

export interface IComponentTreeWidgetProps {
  style?: any
  className?: string
  components: IDesignerComponents
}

export interface ITreeNodeWidgetProps {
  node: TreeNode
  children?: any
}

// Le moteur rend les matériaux : h(Component, props, children) — exactement
// l'équivalent du React.createElement d'ère (le moteur @formivue-design/core est
// consommé tel quel).
export const TreeNodeWidget = observer(
  defineComponent({
    name: 'TreeNodeWidget',
    props: {
      node: { type: Object as PropType<TreeNode>, required: true },
    },
    setup(props) {
      const designer = useDesigner((props.node as any)?.designerProps?.effects)
      const components = useComponents()
      provide(TreeNodeContext, props.node)
      const renderChildren = () => {
        if ((props.node as any)?.designerProps?.selfRenderChildren) return []
        return props.node?.children?.map((child) => {
          return h(TreeNodeWidget, { key: child.id, node: child })
        })
      }
      const renderProps = (extendsProps: any = {}) => {
        const node = props.node as any
        const result = {
          ...node.designerProps?.defaultProps,
          ...extendsProps,
          ...node.props,
          ...node.designerProps?.getComponentProps?.(node),
        }
        if (
          result.style &&
          typeof result.style === 'object' &&
          !Array.isArray(result.style)
        ) {
          result.style = { ...result.style }
        }
        return result
      }
      const renderComponent = () => {
        const node = props.node as any
        const componentName = node.componentName
        const Component = components?.[componentName]
        const dataId = {}
        if (Component) {
          if (designer) {
            dataId[designer?.props?.nodeIdAttrName || 'data-designer-node-id'] =
              node.id
          }
          // enfants calculés ici (suivi réactif dans ce TreeNodeWidget
          // observer), passés en slot fonction (évite le warn Vue « Non-function
          // value encountered for default slot »)
          const children = renderChildren()
          return h(Component, renderProps(dataId), { default: () => children })
        } else {
          if (node?.children?.length) {
            return h(Fragment, {}, renderChildren())
          }
        }
      }
      return () => {
        const node = props.node as any
        if (!node) return null
        if (node.hidden) return null
        return renderComponent()
      }
    },
  }),
)

export const ComponentTreeWidget = observer(
  defineComponent({
    name: 'ComponentTreeWidget',
    props: {
      style: { type: Object, default: undefined },
      className: { type: String, default: undefined },
      components: {
        type: Object as PropType<IDesignerComponents>,
        required: true,
      },
    },
    setup(props) {
      const tree = useTree()
      const prefix = usePrefix('component-tree')
      const designer = useDesigner()
      provide(DesignerComponentsContext, props.components)
      onMounted(() => {
        GlobalRegistry.registerDesignerBehaviors(props.components)
      })
      return () => {
        const dataId = {}
        if (designer && tree) {
          dataId[designer?.props?.nodeIdAttrName || 'data-designer-node-id'] =
            tree.id
        }
        return h(
          'div',
          {
            style: props.components?.[tree?.componentName]
              ? props.style
              : [props.style, tree?.props?.style],
            // structure d'ère (ComponentTreeWidget/styles.less) : plein
            // conteneur minimum (le canvas Form impose sa taille)
            class: cls(prefix, 'min-h-full min-w-full', props.className),
            ...dataId,
          },
          [h(TreeNodeWidget, { node: tree })],
        )
      }
    },
  }),
)
