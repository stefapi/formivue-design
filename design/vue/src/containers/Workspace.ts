import { defineComponent, Fragment, h, provide, reactive, watch } from 'vue'
import { useDesigner } from '../hooks'
import { WorkspaceContext } from '../context'

export interface IWorkspaceProps {
  id?: string
  title?: string
  description?: string
}

// provide dans setup (contract Vue) : la valeur est reactive et syncée sur
// les props (l'ère re-provideait le contexte à chaque render).
export const Workspace = defineComponent({
  name: 'Workspace',
  props: {
    id: { type: String, default: undefined },
    title: { type: String, default: undefined },
    description: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    const designer = useDesigner()
    const ctx = reactive({
      id: props.id || 'index',
      title: props.title,
      description: props.description,
    })
    provide(WorkspaceContext, ctx)

    let oldId: string = null
    const ensure = () => {
      if (!designer) return
      if (oldId && oldId !== ctx.id) {
        const old = designer.workbench.findWorkspaceById(oldId)
        if (old) old.viewport.detachEvents()
      }
      const workspace = {
        id: ctx.id,
        title: ctx.title,
        description: ctx.description,
      }
      designer.workbench.ensureWorkspace(workspace)
      oldId = workspace.id
    }
    ensure()
    watch(
      () => props.id,
      () => {
        ctx.id = props.id || 'index'
        ctx.title = props.title
        ctx.description = props.description
        ensure()
      },
    )
    return () => h(Fragment, null, slots.default?.() as any)
  },
})
