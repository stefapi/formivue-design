import { defineComponent, h } from 'vue'
import { WorkspacePanel } from './WorkspacePanel'
import { Simulator } from '../containers'

export const ViewportPanel = defineComponent({
  name: 'ViewportPanel',
  inheritAttrs: false,
  setup(_props, { slots, attrs }) {
    return () =>
      h(
        WorkspacePanel.Item as any,
        { ...attrs, flexable: true },
        {
          default: () =>
            h(Simulator, null, { default: () => slots.default?.() }),
        },
      )
  },
})
