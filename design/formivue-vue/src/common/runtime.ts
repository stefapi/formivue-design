import { defineComponent, h, markRaw, provide, type Component } from 'vue'
import { GlobalRegistry } from '@formivue-design/core'
import { ArrayMessageKey } from '@formivue-design/formivue-runtime/bindings'

// Attach canvas metadata to a separate Vue component definition.
export const cloneBinding = <T extends Component>(component: T): T =>
  markRaw({ ...component }) as T

export const arrayMessage = (name: string) =>
  GlobalRegistry.getDesignerMessage(`ArrayBase.${name}`) as string | undefined

export const withDesignerArrayMessages = (component: Component) =>
  defineComponent({
    name: component.name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      provide(ArrayMessageKey, arrayMessage)
      return () => h(component, attrs, slots)
    },
  })
