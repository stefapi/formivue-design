import { defineComponent, h, type PropType } from 'vue'
import { Button } from '@formivue-design/vue-ui'
import { observer } from '@formivue/reactive-vue'
import { GlobalRegistry, WorkbenchTypes } from '@formivue-design/core'
import { IconWidget } from '../IconWidget'
import { usePrefix, useWorkbench } from '../../hooks'
import cls from 'classnames'

export interface IViewToolsWidget {
  use?: WorkbenchTypes[]
  style?: any
  className?: string
}

export const ViewToolsWidget = observer(
  defineComponent({
    name: 'ViewToolsWidget',
    props: {
      use: {
        type: Array as PropType<WorkbenchTypes[]>,
        default: () => ['FORMIVUEDESIGN', 'JSONTREE', 'PREVIEW'],
      },
      style: { type: Object, default: undefined },
      className: { type: String, default: undefined },
    },
    setup(props) {
      const workbench = useWorkbench()
      const prefix = usePrefix('view-tools')
      return () =>
        h(
          'div',
          {
            style: props.style,
            class: cls(prefix, props.className, 'flex items-center gap-px'),
          },
          [
            props.use.includes('FORMIVUEDESIGN') &&
              h(
                Button,
                {
                  disabled: workbench?.type === 'FORMIVUEDESIGN',
                  onClick: () => {
                    workbench.type = 'FORMIVUEDESIGN'
                  },
                  size: 'small',
                  'aria-label':
                    GlobalRegistry.getDesignerMessage('views.designable') ||
                    'FormivueDesign view',
                  title:
                    GlobalRegistry.getDesignerMessage('views.designable') ||
                    'FormivueDesign view',
                },
                { default: () => h(IconWidget, { infer: 'Design' }) },
              ),
            props.use.includes('JSONTREE') &&
              h(
                Button,
                {
                  disabled: workbench?.type === 'JSONTREE',
                  onClick: () => {
                    workbench.type = 'JSONTREE'
                  },
                  size: 'small',
                  'aria-label':
                    GlobalRegistry.getDesignerMessage('views.jsonTree') ||
                    'JSON tree view',
                  title:
                    GlobalRegistry.getDesignerMessage('views.jsonTree') ||
                    'JSON tree view',
                },
                { default: () => h(IconWidget, { infer: 'JSON' }) },
              ),
            props.use.includes('MARKUP') &&
              h(
                Button,
                {
                  disabled: workbench?.type === 'MARKUP',
                  onClick: () => {
                    workbench.type = 'MARKUP'
                  },
                  size: 'small',
                  'aria-label':
                    GlobalRegistry.getDesignerMessage('views.markupSchema') ||
                    'Markup schema view',
                  title:
                    GlobalRegistry.getDesignerMessage('views.markupSchema') ||
                    'Markup schema view',
                },
                { default: () => h(IconWidget, { infer: 'Code' }) },
              ),
            props.use.includes('PREVIEW') &&
              h(
                Button,
                {
                  disabled: workbench?.type === 'PREVIEW',
                  onClick: () => {
                    workbench.type = 'PREVIEW'
                  },
                  size: 'small',
                  'aria-label':
                    GlobalRegistry.getDesignerMessage('views.preview') ||
                    'Preview',
                  title:
                    GlobalRegistry.getDesignerMessage('views.preview') ||
                    'Preview',
                },
                { default: () => h(IconWidget, { infer: 'Play' }) },
              ),
          ],
        )
    },
  }),
)
