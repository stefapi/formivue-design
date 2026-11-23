import type { ISchema } from '@formivue/json-schema'
import type { TreeNode } from '@formivue-design/core'
import { getPanelOptions } from './panelOptions'

export const FormCollapse: ISchema & { CollapsePanel?: ISchema } = {
  type: 'object',
  properties: {
    accordion: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
    },
    defaultOpenKeys: {
      type: 'array',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox.Group',
      'x-component-props': {
        class: 'w-full flex-col gap-y-2',
        exclusive: '{{!!$values["x-component-props"]?.accordion}}',
      },
      'x-reactions': (field, { $node }: { $node?: TreeNode }) => {
        const options = getPanelOptions(
          $node,
          'FormCollapse.CollapsePanel',
          'header',
        )
        field.setDataSource(options)
        field.setDisplay(options.length ? 'visible' : 'hidden')
      },
    },
  },
}

FormCollapse.CollapsePanel = {
  type: 'object',
  properties: {
    header: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
}
