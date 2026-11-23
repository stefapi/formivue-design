import { defineComponent, h } from 'vue'
import { WorkspacePanel } from './WorkspacePanel'

export const ToolbarPanel = defineComponent({
  name: 'ToolbarPanel',
  inheritAttrs: false,
  props: {
    style: { type: Object, default: undefined },
    flexable: { type: Boolean, default: false },
  },
  setup(props, { slots, attrs }) {
    return () =>
      h(
        WorkspacePanel.Item as any,
        {
          ...attrs,
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
            padding: '0 4px',
            ...props.style,
          },
        },
        { default: () => slots.default?.() },
      )
  },
})
