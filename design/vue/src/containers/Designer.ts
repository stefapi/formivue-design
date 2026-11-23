import { defineComponent, h, onBeforeUnmount, onMounted, provide } from 'vue'
import { Engine, GlobalRegistry } from '@formivue-design/core'
import { DesignerEngineContext } from '../context'

import { GhostWidget } from '../widgets'
import { useDesigner } from '../hooks'
import { Layout } from './Layout'
import * as icons from '../icons'

GlobalRegistry.registerDesignerIcons(icons)

export const Designer = defineComponent({
  name: 'Designer',
  props: {
    engine: { type: Object as () => Engine, required: true },
    prefixCls: { type: String, default: 'dn-' },
    theme: { type: String, default: 'light' },
    variables: { type: Object, default: undefined },
    position: { type: String, default: 'fixed' },
  },
  setup(props, { slots }) {
    const engine = useDesigner()
    let mountedEngine: Engine = null
    onMounted(() => {
      if (props.engine) {
        if (props.engine && mountedEngine) {
          if (props.engine !== mountedEngine) {
            ;(mountedEngine as any).unmount()
          }
        }
        props.engine.mount()
        mountedEngine = props.engine
      }
    })
    onBeforeUnmount(() => {
      if (props.engine) {
        props.engine.unmount()
      }
      mountedEngine = null
    })

    if (engine)
      throw new Error(
        'There can only be one FormivueDesign Engine Context in the React Tree',
      )

    provide(DesignerEngineContext, props.engine)

    return () =>
      h(
        Layout,
        {
          prefixCls: props.prefixCls,
          theme: props.theme,
          variables: props.variables,
          position: props.position,
        },
        {
          default: () => [slots.default?.(), h(GhostWidget)],
        },
      )
  },
})
