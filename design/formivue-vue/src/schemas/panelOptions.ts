import type { TreeNode } from '@formivue-design/core'
import { matchComponent } from '../shared'

export const getPanelOptions = (
  node: TreeNode | undefined,
  component: string,
  titleProp: 'header' | 'tab',
) => {
  const options = (node?.children ?? [])
    .filter((panel) => matchComponent(panel, component))
    .map((panel) => {
      const props = panel.props['x-component-props']
      const name = panel.props.name || panel.id
      return { label: props?.[titleProp] || name, value: props?.key || name }
    })

  return options.map((option, index) => ({
    ...option,
    label: options.some(
      (other) => other !== option && other.label === option.label,
    )
      ? `${option.label} (${index + 1})`
      : option.label,
  }))
}
