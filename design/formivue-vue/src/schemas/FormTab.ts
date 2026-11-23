import type { ISchema } from '@formivue/json-schema'
import type { TreeNode } from '@formivue-design/core'
import { getPanelOptions } from './panelOptions'

export const FormTab: ISchema & { TabPane?: ISchema } = {
  type: 'object',
  properties: {
    activeKey: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': { defaultValue: '' },
      'x-reactions': (field, { $node }: { $node?: TreeNode }) => {
        const options = getPanelOptions($node, 'FormTab.TabPane', 'tab')
        field.setDataSource([
          {
            label:
              $node?.getMessage(
                'settings.x-component-props.activeKey.placeholder',
              ) ?? 'First available tab',
            value: '',
          },
          ...options,
        ])
        field.setDisplay(options.length ? 'visible' : 'hidden')
      },
    },
  },
}

FormTab.TabPane = {
  type: 'object',
  properties: {
    tab: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
}
