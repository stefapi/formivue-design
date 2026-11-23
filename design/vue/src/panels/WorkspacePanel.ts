import cls from 'classnames'
import { defineComponent, h } from 'vue'
import { usePrefix } from '../hooks'

export interface IWorkspaceItemProps {
  style?: any
  flexable?: boolean
}

const WorkspacePanelItem = defineComponent({
  name: 'WorkspacePanel.Item',
  props: {
    style: { type: Object, default: undefined },
    flexable: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    const prefix = usePrefix('workspace-panel-item')
    return () =>
      h(
        'div',
        {
          // structure d'ère : &-item { position: relative } — ancre le
          // simulateur (absolute inset-0) sous la barre d'outils.
          class: cls(prefix, 'relative'),
          style: {
            ...props.style,
            flexGrow: props.flexable ? 1 : 0,
            flexShrink: props.flexable ? 1 : 0,
          },
        },
        slots.default?.(),
      )
  },
})

export const WorkspacePanel = defineComponent({
  name: 'WorkspacePanel',
  setup(_props, { slots }) {
    const prefix = usePrefix('workspace-panel')
    // structure d'ère (panels/styles.less) : colonne flex grow, padding 4px,
    // fond panel, overflow hidden
    return () =>
      h(
        'div',
        {
          class: cls(
            prefix,
            'flex grow flex-col overflow-hidden bg-muted/50 p-1 box-border relative z-[1]',
          ),
        },
        slots.default?.(),
      )
  },
}) as any

WorkspacePanel.Item = WorkspacePanelItem
