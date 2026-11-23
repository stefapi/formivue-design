import { defineComponent, h } from 'vue'
import { observer } from '@formivue/reactive-vue'
import { useWorkbench } from '../hooks'
import { Workspace } from './Workspace'

export const Workbench = observer(
  defineComponent({
    name: 'Workbench',
    setup(_props, { slots }) {
      const workbench = useWorkbench()
      return () => {
        const id = workbench?.currentWorkspace?.id
        // key : le switch de workspace remonte l'arbre (l'ère résolvait les
        // hooks à chaque render ; Vue résout au setup → remount forcé).
        // Fallback 'index' : le premier rendu (workbench vide, id undefined)
        // et le rendu suivant (ensureWorkspace a créé 'index') partagent la
        // même clé — sinon TOUT le studio se remonte une fois au démarrage
        // (piège du port : React n'a pas de key ici, il re-rend en place).
        return h(
          Workspace,
          { id, key: id ?? 'index' },
          { default: () => slots.default?.() },
        )
      }
    },
  }),
)
